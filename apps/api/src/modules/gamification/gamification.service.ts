import { prisma } from "../../utils/prisma.js";
import { getRedis } from "../../utils/redis.js";
import { emitToUser, emitToClass } from "../../config/socket.js";

// ─── Level Calculation ────────────────────────────────────────────────

export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

export function xpNeededForNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  return currentLevel * currentLevel * 100 - totalXP + 100;
}

// ─── XP Awarding ──────────────────────────────────────────────────────

interface AwardXPResult {
  totalXP: number;
  level: number;
  levelUp: boolean;
  newStreak: number | null;
  badgesEarned: string[];
}

export async function awardXP(
  userId: string,
  amount: number,
  source: string,
  assignmentId?: string | null,
): Promise<AwardXPResult> {
  // Get level before
  const transactions = await prisma.xPTransaction.findMany({
    where: { userId },
    select: { amount: true },
  });
  const prevTotalXP = transactions.reduce((sum, t) => sum + t.amount, 0);
  const prevLevel = calculateLevel(prevTotalXP);

  // Create XP transaction
  await prisma.xPTransaction.create({
    data: {
      userId,
      amount,
      source: source as any,
      assignmentId,
    },
  });

  // Get new level
  const newTotalXP = prevTotalXP + amount;
  const newLevel = calculateLevel(newTotalXP);
  const levelUp = newLevel > prevLevel;

  // Update lastActiveAt
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });

  // Evaluate streak
  const newStreak = await updateStreak(userId);

  // Evaluate badges
  const badgesEarned = await evaluateBadges(userId);

  // Emit socket events
  emitToUser(userId, "xp:updated", {
    totalXP: newTotalXP,
    level: newLevel,
    xpGained: amount,
    source,
    levelUp,
  });

  if (levelUp) {
    emitToUser(userId, "level:up", { level: newLevel });
  }

  return {
    totalXP: newTotalXP,
    level: newLevel,
    levelUp,
    newStreak,
    badgesEarned,
  };
}

// Award the once-per-day login XP (10 XP, CLAUDE.md §4.7). Idempotent:
// checks for an existing DAILY_LOGIN transaction since UTC midnight —
// the same day boundary the streak system uses.
export async function awardDailyLoginXP(userId: string): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const already = await prisma.xPTransaction.findFirst({
    where: { userId, source: "DAILY_LOGIN", createdAt: { gte: startOfDay } },
    select: { id: true },
  });
  if (already) return;

  await awardXP(userId, 10, "DAILY_LOGIN");
}

// Award the one-time first-tool-use XP (20 XP, CLAUDE.md §4.7).
// Idempotent: at most one FIRST_TOOL_USE transaction per user, ever.
export async function awardFirstToolUseXP(userId: string): Promise<void> {
  const already = await prisma.xPTransaction.findFirst({
    where: { userId, source: "FIRST_TOOL_USE" },
    select: { id: true },
  });
  if (already) return;

  await awardXP(userId, 20, "FIRST_TOOL_USE");
}

// ─── Streak System ────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<number> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const streak = await prisma.streak.findUnique({ where: { userId } });

  if (!streak) {
    // First time — create streak
    const newStreak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: now,
      },
    });
    return newStreak.currentStreak;
  }

  const lastDate = streak.lastActiveDate.toISOString().split("T")[0];

  // Already active today
  if (lastDate === today) {
    return streak.currentStreak;
  }

  // Check if within 48 hours (streak maintained)
  const hoursSinceLastActive =
    (now.getTime() - streak.lastActiveDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastActive <= 48) {
    // Streak continues
    const newStreak = streak.currentStreak + 1;
    const updated = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(streak.longestStreak, newStreak),
        lastActiveDate: now,
      },
    });
    return updated.currentStreak;
  }

  // Streak broken — reset to 1
  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: 1,
      lastActiveDate: now,
    },
  });
  return updated.currentStreak;
}

// ─── Badge Evaluation ─────────────────────────────────────────────────

// Condition keys implemented here MUST stay in sync with the badges
// seeded in prisma/seed-tools-and-badges.ts.
export async function evaluateBadges(userId: string): Promise<string[]> {
  const earned: string[] = [];

  const submissionCount = await prisma.submission.count({
    where: { studentId: userId, deletedAt: null },
  });

  const streak = await prisma.streak.findUnique({ where: { userId } });

  // AI Activity Log stats (AuditLog = the student-facing AI interaction
  // log, not SecurityAuditLog). Drives used_5_tools / logged_10_ai /
  // clean_20_ai.
  const aiLogCount = await prisma.auditLog.count({
    where: { studentId: userId },
  });
  const flaggedLogCount = await prisma.auditLog.count({
    where: { studentId: userId, isFlagged: true },
  });
  const distinctTools = await prisma.auditLog.groupBy({
    by: ["toolUsed"],
    where: { studentId: userId },
  });
  const distinctToolCount = distinctTools.length;

  // Get all active badge definitions
  const badges = await prisma.badge.findMany({
    where: { isActive: true },
    select: { id: true, name: true, conditionKey: true, requiredCount: true, xpReward: true },
    orderBy: { xpReward: "asc" },
  });

  // Get already earned badges
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedIds = new Set(existingBadges.map((b) => b.badgeId));

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let meetsCondition = false;

    switch (badge.conditionKey) {
      case "first_assignment":
        meetsCondition = submissionCount >= 1;
        break;
      case "used_5_tools":
        meetsCondition = distinctToolCount >= 5;
        break;
      case "streak_7":
        meetsCondition = (streak?.currentStreak || 0) >= 7;
        break;
      case "rank_1":
        meetsCondition = await isTopOfClassLeaderboard(userId);
        break;
      case "logged_10_ai":
        meetsCondition = aiLogCount >= 10;
        break;
      case "clean_20_ai":
        meetsCondition = aiLogCount >= 20 && flaggedLogCount === 0;
        break;
    }

    if (meetsCondition) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          progressCount: badge.requiredCount,
        },
      });
      // Badges carry an XP reward (CLAUDE.md §4.7). Written directly —
      // going through awardXP() here would recurse back into
      // evaluateBadges().
      if (badge.xpReward > 0) {
        await prisma.xPTransaction.create({
          data: {
            userId,
            amount: badge.xpReward,
            source: "BADGE_EARNED",
          },
        });
        emitToUser(userId, "xp:updated", {
          totalXP: undefined, // client refetches
          xpGained: badge.xpReward,
          source: "BADGE_EARNED",
        });
      }
      earned.push(badge.name);
      emitToUser(userId, "badge:earned", { badgeId: badge.id, name: badge.name });
    }
  }

  return earned;
}

// True when the user currently holds the #1 XP total in any class they
// belong to (needs at least one other member, so a class of one doesn't
// hand out Top Scholar).
async function isTopOfClassLeaderboard(userId: string): Promise<boolean> {
  const memberships = await prisma.classMember.findMany({
    where: { userId },
    select: { classId: true },
  });

  for (const { classId } of memberships) {
    const members = await prisma.classMember.findMany({
      where: { classId },
      select: { userId: true },
    });
    if (members.length < 2) continue;

    const memberIds = members.map((m) => m.userId);
    const xpGroups = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      _sum: { amount: true },
      where: { userId: { in: memberIds } },
    });

    let topUserId: string | null = null;
    let topXP = 0;
    for (const g of xpGroups) {
      const xp = g._sum.amount || 0;
      if (xp > topXP) {
        topXP = xp;
        topUserId = g.userId;
      }
    }

    if (topUserId === userId && topXP > 0) return true;
  }

  return false;
}

// ─── Daily Challenge ──────────────────────────────────────────────────

interface DailyChallengeResult {
  id: string;
  date: string;
  action: string;
  completed: boolean;
  xpAwarded: number | null;
}

const CHALLENGES = [
  "Use an AI Tool today",
  "Submit an assignment",
  "Achieve 90%+ on a graded assignment",
  "Earn a streak bonus",
  "Check the scoreboard rankings",
];

export function generateChallenge(userId: string, date: string): string {
  // Deterministic: same user sees same challenge for the same date
  const seed = `${userId}-${date}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return CHALLENGES[Math.abs(hash) % CHALLENGES.length];
}

export async function getDailyChallenge(userId: string): Promise<DailyChallengeResult> {
  const today = new Date().toISOString().split("T")[0];

  // Try to fetch existing challenge
  const existing = await prisma.dailyChallenge.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing) {
    return {
      id: existing.id,
      date: existing.date,
      action: existing.action,
      completed: existing.completed,
      xpAwarded: existing.xpAwarded,
    };
  }

  // Generate new challenge
  const action = generateChallenge(userId, today);
  const created = await prisma.dailyChallenge.create({
    data: {
      userId,
      date: today,
      action,
    },
  });

  return {
    id: created.id,
    date: created.date,
    action: created.action,
    completed: created.completed,
    xpAwarded: created.xpAwarded,
  };
}

export async function completeDailyChallenge(
  userId: string,
  action: string,
): Promise<DailyChallengeResult | null> {
  const today = new Date().toISOString().split("T")[0];

  const challenge = await prisma.dailyChallenge.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!challenge || challenge.completed) return null;

  // Verify the action matches
  if (challenge.action !== action) {
    return null;
  }

  const xpAmount = 50;

  const updated = await prisma.dailyChallenge.update({
    where: { id: challenge.id },
    data: {
      completed: true,
      completedAt: new Date(),
      xpAwarded: xpAmount,
    },
  });

  // Award XP through the canonical path — transaction record, streak
  // update, badge evaluation, and Socket.io emits all happen in awardXP.
  await awardXP(userId, xpAmount, "DAILY_CHALLENGE");

  return {
    id: updated.id,
    date: updated.date,
    action: updated.action,
    completed: updated.completed,
    xpAwarded: updated.xpAwarded,
  };
}
