import type { JourneyProfile, Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma.js";
import {
  BADGES,
  type BadgeCtx,
  CREATION_XP_DAILY_CAP,
  PROMPT_BUILT_DAILY_CAP,
  TOOL_CATEGORIES,
  XP_TABLE,
  levelForXp,
} from "./journey.constants.js";
import type { JourneyEventInput } from "./journey.schema.js";

// The journey ledger is JourneyEvent (xpAwarded per row), NOT XPTransaction.
// The academic dashboards sum XPTransaction for class rank; journey XP must
// never leak into those aggregates, so the two ledgers stay disjoint.

// School product for India — day boundaries (quests, daily caps, streaks)
// are IST regardless of where the server runs.
const DAY_TZ = "Asia/Kolkata";

function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: DAY_TZ }).format(d);
}

function startOfTodayUtc(now: Date): Date {
  // Midnight IST expressed as a UTC instant, for createdAt >= comparisons.
  return new Date(`${dayKey(now)}T00:00:00.000+05:30`);
}

type Tx = Prisma.TransactionClient;

async function ensureProfile(userId: string): Promise<JourneyProfile> {
  return prisma.journeyProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// Serializes concurrent writers for one user. The row is guaranteed to exist
// (ensureProfile ran first), so FOR UPDATE always locks something.
async function lockProfile(tx: Tx, userId: string): Promise<JourneyProfile> {
  await tx.$executeRaw`SELECT id FROM journey_profiles WHERE "userId" = ${userId} FOR UPDATE`;
  return tx.journeyProfile.findUniqueOrThrow({ where: { userId } });
}

export async function getOrCreateProfile(userId: string): Promise<JourneyProfile> {
  return ensureProfile(userId);
}

export function serializeProfile(p: JourneyProfile) {
  const questDoneToday = p.questDoneOn ? dayKey(p.questDoneOn) === dayKey(new Date()) : false;
  return {
    journeyRole: p.journeyRole,
    classGroup: p.classGroup,
    avatar: p.avatar,
    locale: p.locale,
    classCode: p.classCode,
    xp: p.xp,
    level: levelForXp(p.xp),
    streak: p.streak,
    longestStreak: p.longestStreak,
    questsDone: p.questsDone,
    questDoneToday,
    toolsSeen: p.toolsSeen,
    toolScores: (p.toolScores ?? {}) as Record<string, number>,
    chaptersUsed: p.chaptersUsed,
    promptTemplatesUsed: p.promptTemplatesUsed,
    starterDone: p.starterDone,
    teacherModulesDone: p.teacherModulesDone,
    badges: p.badges,
    badgeDates: (p.badgeDates ?? {}) as Record<string, number>,
  };
}

function buildBadgeCtx(p: JourneyProfile, creationCount: number): BadgeCtx {
  const scores = (p.toolScores ?? {}) as Record<string, number>;
  const vals = Object.values(scores).filter((v) => typeof v === "number");
  const cats = new Set(p.toolsSeen.map((s) => TOOL_CATEGORIES[s]).filter(Boolean));
  return {
    tools: p.toolsSeen.length,
    mastered: vals.filter((v) => v >= 80).length,
    perfect: vals.filter((v) => v === 100).length,
    streak: p.streak,
    level: levelForXp(p.xp),
    quests: p.questsDone,
    inClass: p.classCode.length > 0,
    chapters: p.chaptersUsed.length,
    catsUsed: cats.size,
    promptTemplates: p.promptTemplatesUsed.length,
    creations: creationCount,
    starter: p.starterDone.length,
  };
}

// Streak rule (server-owned; the SPA never implemented one): same IST day is
// a no-op; activity on the very next IST day extends the run; any skipped
// day resets to 1 (never 0).
function nextStreak(p: JourneyProfile, now: Date): { streak: number; longest: number } {
  if (!p.lastActiveDate) return { streak: Math.max(1, p.streak), longest: Math.max(1, p.longestStreak) };
  const today = dayKey(now);
  const last = dayKey(p.lastActiveDate);
  if (last === today) return { streak: p.streak, longest: p.longestStreak };
  const yesterday = dayKey(new Date(now.getTime() - 864e5));
  const streak = last === yesterday ? p.streak + 1 : 1;
  return { streak, longest: Math.max(p.longestStreak, streak) };
}

interface Mutation {
  xp: number;
  timeline?: { kind: string; label: string; meta?: Prisma.InputJsonValue };
}

// Applies one event against the in-memory (row-locked) profile draft.
// Duplicate or out-of-rule events return null or award 0 XP but never
// error — the SPA replays freely (offline queue, login backfill), so
// idempotency is the contract.
function applyEvent(
  draft: JourneyProfile,
  ev: JourneyEventInput,
  now: Date,
  dailyCounts: { promptBuilt: number },
): Mutation | null {
  switch (ev.kind) {
    case "tool_explored": {
      const { slug } = ev.payload;
      if (draft.toolsSeen.includes(slug)) return null;
      draft.toolsSeen = [...draft.toolsSeen, slug];
      return {
        xp: XP_TABLE.tool,
        timeline: { kind: "tool", label: slug },
      };
    }
    case "quiz_completed": {
      const { slug, pct } = ev.payload;
      const scores = { ...((draft.toolScores ?? {}) as Record<string, number>) };
      const prev = scores[slug] ?? 0;
      if (pct <= prev) return null;
      scores[slug] = pct;
      draft.toolScores = scores as unknown as JourneyProfile["toolScores"];
      // XP only on threshold crossings, so replaying 61,62,…,100 can't farm:
      // pass (>=60) pays once per tool, perfect (===100) pays once per tool.
      const xp =
        (prev < 60 && pct >= 60 ? XP_TABLE.quizPass : 0) +
        (prev < 100 && pct === 100 ? XP_TABLE.quizPerfect : 0);
      return {
        xp,
        timeline: { kind: "quiz", label: slug, meta: { pct } },
      };
    }
    case "quest_completed": {
      if (draft.questDoneOn && dayKey(draft.questDoneOn) === dayKey(now)) return null;
      draft.questsDone += 1;
      draft.questDoneOn = now;
      return {
        xp: XP_TABLE.quest,
        timeline: { kind: "quest", label: "Daily quest" },
      };
    }
    case "curriculum_prompt": {
      const { chapterSlug, title } = ev.payload;
      if (draft.chaptersUsed.includes(chapterSlug)) return null;
      draft.chaptersUsed = [...draft.chaptersUsed, chapterSlug];
      return {
        xp: XP_TABLE.curriculumPrompt,
        timeline: { kind: "chapter", label: title ?? chapterSlug, meta: { chapterSlug } },
      };
    }
    case "prompt_built": {
      const { tplKey } = ev.payload;
      const isNewTemplate = !draft.promptTemplatesUsed.includes(tplKey);
      const capped = dailyCounts.promptBuilt >= PROMPT_BUILT_DAILY_CAP;
      if (!isNewTemplate && capped) return null;
      if (isNewTemplate) {
        draft.promptTemplatesUsed = [...draft.promptTemplatesUsed, tplKey];
      }
      if (!capped) dailyCounts.promptBuilt += 1;
      const xp = capped ? 0 : XP_TABLE.promptBuilt;
      return {
        xp,
        timeline: xp > 0 ? { kind: "prompt", label: tplKey } : undefined,
      };
    }
    case "starter_step": {
      const { key } = ev.payload;
      if (draft.starterDone.includes(key)) return null;
      draft.starterDone = [...draft.starterDone, key];
      return { xp: XP_TABLE.starterStep };
    }
    case "upskill_module": {
      const { key } = ev.payload;
      if (draft.teacherModulesDone.includes(key)) return null;
      draft.teacherModulesDone = [...draft.teacherModulesDone, key];
      return {
        xp: XP_TABLE.upskillModule,
        timeline: { kind: "prompt", label: `Upskill: ${key}` },
      };
    }
    case "class_join": {
      if (draft.classCode === ev.payload.code) return null;
      const firstJoin = draft.classCode.length === 0;
      draft.classCode = ev.payload.code;
      return { xp: firstJoin ? XP_TABLE.classJoin : 0 };
    }
    case "avatar_set": {
      if (draft.avatar === ev.payload.avatar) return null;
      draft.avatar = ev.payload.avatar;
      return { xp: 0 };
    }
    case "settings": {
      if (!ev.payload.locale || draft.locale === ev.payload.locale) return null;
      draft.locale = ev.payload.locale;
      return { xp: 0 };
    }
  }
}

async function xpAwardedToday(tx: Tx, userId: string, kind: string, now: Date): Promise<number> {
  return tx.journeyEvent.count({
    where: { userId, kind, xpAwarded: { gt: 0 }, createdAt: { gte: startOfTodayUtc(now) } },
  });
}

// Shared tail of every mutating call: streak, badge pass, profile write,
// ledger rows. Must run inside the row-locked transaction.
async function finalize(
  tx: Tx,
  profile: JourneyProfile,
  draft: JourneyProfile,
  mutations: Mutation[],
  now: Date,
): Promise<{ updated: JourneyProfile; awardedXP: number; newBadges: string[] }> {
  const { streak, longest } = nextStreak(profile, now);
  draft.streak = streak;
  draft.longestStreak = longest;

  const awardedXP = mutations.reduce((s, m) => s + m.xp, 0);
  draft.xp = profile.xp + awardedXP;

  const creationCount = await tx.journeyCreation.count({ where: { userId: profile.userId, deletedAt: null } });
  const ctx = buildBadgeCtx(draft, creationCount);
  const newBadges = BADGES.filter((b) => !draft.badges.includes(b.key) && b.need(ctx)).map((b) => b.key);
  const badgeDates = { ...((draft.badgeDates ?? {}) as Record<string, number>) };
  for (const k of newBadges) badgeDates[k] = now.getTime();

  // Absolute writes of the draft are safe here: every mutating path holds
  // the FOR UPDATE row lock, so the draft is the only in-flight version.
  // (Field-level `push` patches were tried first — two events touching the
  // same array in one batch clobbered each other via Object.assign.)
  const data: Prisma.JourneyProfileUpdateInput = {
    streak: draft.streak,
    longestStreak: draft.longestStreak,
    lastActiveDate: now,
    xp: draft.xp,
    questsDone: draft.questsDone,
    questDoneOn: draft.questDoneOn,
    classCode: draft.classCode,
    avatar: draft.avatar,
    locale: draft.locale,
    toolsSeen: draft.toolsSeen,
    toolScores: (draft.toolScores ?? {}) as Prisma.InputJsonValue,
    chaptersUsed: draft.chaptersUsed,
    promptTemplatesUsed: draft.promptTemplatesUsed,
    starterDone: draft.starterDone,
    teacherModulesDone: draft.teacherModulesDone,
    badges: [...draft.badges, ...newBadges],
    badgeDates,
  };

  const updated = await tx.journeyProfile.update({ where: { userId: profile.userId }, data });

  const timelineRows: Prisma.JourneyEventCreateManyInput[] = mutations
    .filter((m) => m.timeline)
    .map((m) => ({
      userId: profile.userId,
      kind: m.timeline!.kind,
      label: m.timeline!.label,
      meta: m.timeline!.meta,
      xpAwarded: m.xp,
    }));
  for (const k of newBadges) {
    timelineRows.push({ userId: profile.userId, kind: "badge", label: k, xpAwarded: 0 });
  }
  if (timelineRows.length) await tx.journeyEvent.createMany({ data: timelineRows });

  return { updated, awardedXP, newBadges };
}

export interface EventsResult {
  accepted: number;
  awardedXP: number;
  newBadges: string[];
  profile: ReturnType<typeof serializeProfile>;
}

export async function processEvents(
  userId: string,
  events: JourneyEventInput[],
): Promise<EventsResult> {
  const now = new Date();
  await ensureProfile(userId);

  return prisma.$transaction(async (tx) => {
    const profile = await lockProfile(tx, userId);
    const draft: JourneyProfile = { ...profile };

    const dailyCounts = {
      promptBuilt: await xpAwardedToday(tx, userId, "prompt", now),
    };

    const mutations: Mutation[] = [];
    for (const ev of events) {
      const m = applyEvent(draft, ev, now, dailyCounts);
      if (m) mutations.push(m);
    }

    const { updated, awardedXP, newBadges } = await finalize(tx, profile, draft, mutations, now);
    return {
      accepted: mutations.length,
      awardedXP,
      newBadges,
      profile: serializeProfile(updated),
    };
  });
}

export async function onboardProfile(
  userId: string,
  input: {
    journeyRole: string;
    classGroup?: string;
    avatar?: string;
    locale?: string;
    classCode?: string;
    name?: string;
  },
) {
  const now = new Date();
  await ensureProfile(userId);

  return prisma.$transaction(async (tx) => {
    const profile = await lockProfile(tx, userId);
    if (input.name) {
      await tx.user.update({ where: { id: userId }, data: { name: input.name } });
    }

    const first = !profile.onboardedAt;
    const xp = first ? XP_TABLE.onboard + (input.avatar ? XP_TABLE.avatar : 0) : 0;
    if (xp > 0) {
      await tx.journeyEvent.create({
        data: { userId, kind: "onboard", label: "Welcome aboard", xpAwarded: xp },
      });
    }

    const updated = await tx.journeyProfile.update({
      where: { userId },
      data: {
        journeyRole: input.journeyRole,
        ...(input.classGroup ? { classGroup: input.classGroup } : {}),
        ...(input.avatar ? { avatar: input.avatar } : {}),
        ...(input.locale ? { locale: input.locale } : {}),
        ...(input.classCode ? { classCode: input.classCode } : {}),
        ...(first ? { onboardedAt: now } : {}),
        ...(xp > 0 ? { xp: { increment: xp } } : {}),
        lastActiveDate: now,
      },
    });
    return serializeProfile(updated);
  });
}

export async function addCreation(
  userId: string,
  input: { title: string; tool: string; link?: string; note?: string; emoji?: string },
) {
  const now = new Date();
  await ensureProfile(userId);

  return prisma.$transaction(async (tx) => {
    const profile = await lockProfile(tx, userId);
    const draft: JourneyProfile = { ...profile };

    const awardsToday = await xpAwardedToday(tx, userId, "creation", now);
    const xp = awardsToday >= CREATION_XP_DAILY_CAP ? 0 : XP_TABLE.creation;

    const creation = await tx.journeyCreation.create({
      data: {
        userId,
        title: input.title,
        tool: input.tool,
        link: input.link || null,
        note: input.note ?? null,
        emoji: input.emoji ?? "✨",
      },
    });

    const mutation: Mutation = {
      xp,
      timeline: { kind: "creation", label: input.title },
    };
    const { updated, newBadges } = await finalize(tx, profile, draft, [mutation], now);

    return {
      creation: {
        id: creation.id,
        title: creation.title,
        tool: creation.tool,
        link: creation.link,
        note: creation.note,
        emoji: creation.emoji,
        ts: creation.createdAt.getTime(),
      },
      awardedXP: xp,
      newBadges,
      profile: serializeProfile(updated),
    };
  });
}

export async function listCreations(userId: string) {
  const rows = await prisma.journeyCreation.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((c) => ({
    id: c.id,
    title: c.title,
    tool: c.tool,
    link: c.link,
    note: c.note,
    emoji: c.emoji,
    ts: c.createdAt.getTime(),
  }));
}

export async function deleteCreation(userId: string, id: string) {
  const { count } = await prisma.journeyCreation.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count > 0;
}

export async function getTimeline(userId: string) {
  const rows = await prisma.journeyEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return rows.map((e) => ({
    k: e.kind,
    l: e.label,
    ts: e.createdAt.getTime(),
    m: e.meta ?? undefined,
  }));
}

export async function getLeaderboard(userId: string) {
  const me = await ensureProfile(userId);
  const meEntry = {
    rank: 1,
    name: "You",
    avatar: me.avatar,
    level: levelForXp(me.xp),
    xp: me.xp,
    isMe: true,
  };

  // No class code → no board. A platform-wide board of real names would
  // contradict the SPA's own privacy copy ("only your class"), so scope
  // 'none' returns just the caller and the SPA falls back to local peers.
  if (!me.classCode) {
    return { scope: "none" as const, entries: [meEntry] };
  }

  const rows = await prisma.journeyProfile.findMany({
    where: { classCode: me.classCode },
    orderBy: { xp: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });
  const entries = rows.map((p, i) => ({
    rank: i + 1,
    // First name only — classmates see rank, not full identity.
    name: (p.user.name ?? "Student").split(" ")[0],
    avatar: p.avatar,
    level: levelForXp(p.xp),
    xp: p.xp,
    isMe: p.userId === userId,
  }));
  if (!entries.some((e) => e.isMe)) {
    const better = await prisma.journeyProfile.count({
      where: { classCode: me.classCode, xp: { gt: me.xp } },
    });
    entries.push({ ...meEntry, rank: better + 1 });
  }
  return { scope: "class" as const, entries };
}
