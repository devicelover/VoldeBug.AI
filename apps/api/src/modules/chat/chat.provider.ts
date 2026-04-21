// ─── LLM provider abstraction ────────────────────────────────────────────
//
// The chat module talks to "an LLM" through this interface. The concrete
// implementation is chosen at boot from env:
//
//   LLM_PROVIDER=stub       (default — polite placeholder; still logs)
//   LLM_PROVIDER=openai     (when OPENAI_API_KEY is set)
//   LLM_PROVIDER=anthropic  (when ANTHROPIC_API_KEY is set)
//
// Adding a real provider = implement ChatProvider + register in providerFor().
// The rest of the system (integrity logging, rate limits, UI) doesn't care.
//
// For Voldebug specifically, "stub" is not throwaway work — the integrity
// pipeline logs prompts regardless of whether we return a real LLM
// response, so even a stubbed deployment captures + flags student prompt
// patterns. Real LLM answers are the polish, not the core value.

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  maxOutputTokens?: number;
  // Pedagogical mode — "socratic" tells the provider to only ask
  // questions, never give direct answers. See CLAUDE.md §3 and the
  // Tier-2 "Socratic Mode" differentiator.
  mode?: "default" | "socratic";
}

export interface ChatCompletionResult {
  content: string;
  provider: string;
  model: string | null;
  cached: boolean;
}

export interface ChatProvider {
  name: string;
  complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

// ─── Stub provider ───────────────────────────────────────────────────────
// Returns a helpful placeholder so the UI is fully testable without
// costing an API call. The response is deliberately educational — it
// tells the student the proxy is in demo mode and nudges them toward
// the ethical-AI-use framing we want them to internalize.

export class StubProvider implements ChatProvider {
  name = "stub";
  async complete(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user");
    const preview = (lastUser?.content ?? "").slice(0, 120);

    const socraticHint =
      opts.mode === "socratic"
        ? "Your teacher has set this chat to Socratic mode — I'm meant to ask questions that help you think, not hand you answers. "
        : "";

    const body =
      `${socraticHint}I read your prompt ("${preview}${preview.length === 120 ? "…" : ""}"). ` +
      `This is a demo Voldebug Chat response — a real model will take over once your school configures an OpenAI or Anthropic key. ` +
      `In the meantime, your prompt has still been logged to your AI Activity Log, so you can practice transparent, ethical AI use.`;

    return {
      content: body,
      provider: "stub",
      model: null,
      cached: false,
    };
  }
}

// ─── Provider selection ──────────────────────────────────────────────────

let cachedProvider: ChatProvider | null = null;

export function providerFor(): ChatProvider {
  if (cachedProvider) return cachedProvider;
  const kind = (process.env.LLM_PROVIDER ?? "stub").toLowerCase();
  // Real provider wiring deliberately lives here as a single switch so
  // the rest of the module never touches provider-specific SDKs.
  switch (kind) {
    // case "openai":    cachedProvider = new OpenAIProvider(...); break;
    // case "anthropic": cachedProvider = new AnthropicProvider(...); break;
    default:
      cachedProvider = new StubProvider();
  }
  return cachedProvider;
}
