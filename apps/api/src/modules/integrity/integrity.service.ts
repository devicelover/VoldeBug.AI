import { createHash } from "node:crypto";
import { prisma } from "../../utils/prisma.js";
import {
  AI_INTEGRITY_FLAGS,
  countWords,
  evaluateRules,
  type AiIntegrityFlag,
} from "./integrity.rules.js";

export interface CaptureInput {
  studentId: string;
  promptText: string;
  aiResponse: string;
  toolUsed: string;
  assignmentId?: string | null;
  source?: string; // "manual_paste" | "voldebug_chat" | "browser_ext"
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Capture an AI interaction, run detection rules synchronously, and
 * persist with `flagReasons` + `isFlagged` populated.
 *
 * Synchronous flag evaluation is intentional: response time is not
 * critical (this is a fire-and-forget log call from the student UI),
 * and surfacing flags immediately means we can return them to the
 * student so they understand what's tracked. The principal/teacher
 * sees the same flags later.
 */
export async function captureAiInteraction(input: CaptureInput) {
  const promptText = input.promptText.trim();
  const aiResponse = input.aiResponse.trim();
  if (!promptText) throw new Error("promptText is required");
  if (!aiResponse) throw new Error("aiResponse is required");

  const promptHash = sha256(promptText);
  const responseHash = sha256(aiResponse);
  const promptLength = countWords(promptText);
  const responseLength = countWords(aiResponse);
  const now = new Date();

  // Optional context for the rule engine — fetch the assignment's due
  // date and check whether another student got the SAME AI response.
  let assignment: { id: string; dueDate: Date } | null = null;
  if (input.assignmentId) {
    assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      select: { id: true, dueDate: true },
    });
  }

  const identical = await prisma.auditLog.findFirst({
    where: {
      responseHash,
      studentId: { not: input.studentId },
    },
    select: { id: true },
  });

  const flagReasons = evaluateRules(
    {
      promptText,
      aiResponse,
      responseLength,
      timestamp: now,
    },
    {
      assignment,
      identicalResponseExistsForOtherStudent: !!identical,
    },
  );

  const created = await prisma.auditLog.create({
    data: {
      studentId: input.studentId,
      assignmentId: input.assignmentId ?? null,
      promptText,
      aiResponse,
      toolUsed: input.toolUsed,
      promptHash,
      responseHash,
      promptLength,
      responseLength,
      flagReasons,
      isFlagged: flagReasons.length > 0,
      source: input.source ?? "manual_paste",
      timestamp: now,
    },
    select: {
      id: true,
      isFlagged: true,
      flagReasons: true,
      timestamp: true,
      assignmentId: true,
    },
  });

  return created;
}

/** Student's own AI activity history (paginated). */
export async function getMyAiHistory(opts: {
  studentId: string;
  page?: number;
  limit?: number;
}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { studentId: opts.studentId },
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        toolUsed: true,
        promptText: true,
        promptLength: true,
        responseLength: true,
        flagReasons: true,
        isFlagged: true,
        source: true,
        timestamp: true,
        assignment: { select: { id: true, title: true } },
      },
    }),
    prisma.auditLog.count({ where: { studentId: opts.studentId } }),
  ]);

  return { logs, total, page, limit };
}

/** Re-export for the controller. */
export { AI_INTEGRITY_FLAGS, type AiIntegrityFlag };
