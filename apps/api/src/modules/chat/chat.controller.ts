import type { Request, Response } from "express";
import { z } from "zod";
import { apiSuccess, apiError } from "../../utils/api.js";
import { captureAiInteraction } from "../integrity/integrity.service.js";
import { providerFor, type ChatMessage } from "./chat.provider.js";
import { getSuggestions } from "./chat.suggestions.js";

// ─── Send a message ─────────────────────────────────────────────────────

const sendSchema = z.object({
  // Full client-side history — lets the provider maintain context and
  // keeps the server stateless. Bounded to prevent runaway tokens.
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  assignmentId: z.string().min(1).optional(),
  mode: z.enum(["default", "socratic"]).optional(),
});

export async function handleSend(req: Request, res: Response) {
  const userId = req.userId!;
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid chat payload",
      status: 422,
    });
  }
  const { messages, assignmentId, mode } = parsed.data;

  // Last user message is the one we log as "the prompt". Earlier context
  // is shown to the model but not stored as a separate integrity record.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: "At least one user message is required",
      status: 422,
    });
  }

  try {
    const provider = providerFor();
    const result = await provider.complete({
      messages: messages as ChatMessage[],
      mode,
    });

    // Log the interaction for integrity detection, in the same table the
    // manual-paste flow uses. source="voldebug_chat" so teachers can
    // tell which capture mechanism the prompt came from.
    const logged = await captureAiInteraction({
      studentId: userId,
      promptText: lastUser.content,
      aiResponse: result.content,
      toolUsed: `Voldebug Chat (${result.provider})`,
      assignmentId,
      source: "voldebug_chat",
    });

    return apiSuccess(res, {
      reply: {
        role: "assistant" as const,
        content: result.content,
      },
      provider: result.provider,
      model: result.model,
      integrity: {
        id: logged.id,
        isFlagged: logged.isFlagged,
        flagReasons: logged.flagReasons,
      },
    });
  } catch (err) {
    return apiError(res, {
      code: "CHAT_FAILED",
      message: (err as Error).message,
      status: 500,
    });
  }
}

// ─── Suggestions ────────────────────────────────────────────────────────

const suggestionsSchema = z.object({
  subject: z.string().max(60).optional(),
  assignmentId: z.string().min(1).optional(),
});

export async function handleSuggestions(req: Request, res: Response) {
  const parsed = suggestionsSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid suggestions query",
      status: 422,
    });
  }

  try {
    const suggestions = await getSuggestions({
      subject: parsed.data.subject ?? null,
      assignmentId: parsed.data.assignmentId ?? null,
    });
    return apiSuccess(res, { suggestions });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to load suggestions",
      status: 500,
    });
  }
}
