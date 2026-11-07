import Anthropic from "@anthropic-ai/sdk";
import { generateVoiceover, type Voiceover } from "@/lib/elevenlabs";
import { renderVideo } from "@/lib/render";
import { MODELS, type Settings } from "@/lib/settings";
import type { Message, SessionCost, UploadedFile } from "@/types";

type MessageParam = Anthropic.Beta.Messages.BetaMessageParam;
type ContentBlockParam = Anthropic.Beta.Messages.BetaContentBlockParam;
type ToolResult = Anthropic.Beta.Messages.BetaToolResultBlockParam;
type ToolUse = Anthropic.Beta.Messages.BetaToolUseBlock;

// Guardrails so a single run can never run away with the user's credits.
const MAX_ITERATIONS = 6;
const MAX_TOKENS_PER_CALL = 8000; // a script and two tool calls need far less; caps a runaway call
const MAX_VOICEOVERS = 2;
const MAX_RENDERS = 1;
const MAX_SCRIPT_WORDS = 120;
const MAX_SCRIPT_CHARS = 900;
const ELEVENLABS_PER_CHAR = 0.00018; // paid tier estimate

const SYSTEM_PROMPT = `You are DemoVox, an AI agent that produces short product demo videos.

The user describes their product and may attach screenshots. Each screenshot is preceded by a line with its asset id.

When you have enough to work with, follow this sequence:
1. Write a compelling voiceover script of 40–90 words (about 15–35 seconds of speech) based on the description and screenshots.
2. Call generate_voiceover with the script.
3. Call render_video with the title, tagline, the asset ids of the screenshots to show (in order) and an accent color.
4. Confirm to the user that the video is ready in one or two sentences.

If the description is too vague to write a script, ask one short question instead of calling tools.
Keep your messages concise. Do not describe what you are about to do — just do it.`;

const TOOLS: Anthropic.Beta.Messages.BetaTool[] = [
  {
    name: "generate_voiceover",
    description:
      "Generates the narration audio from a script using ElevenLabs text-to-speech. The video length follows the audio length.",
    input_schema: {
      type: "object",
      properties: {
        script: { type: "string", description: `The narration script, 40–90 words, never more than ${MAX_SCRIPT_WORDS}.` },
      },
      required: ["script"],
    },
  },
  {
    name: "render_video",
    description:
      "Renders the final MP4 in the user's browser using the most recent voiceover. Call generate_voiceover first.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Product name displayed on screen (max 60 characters)." },
        tagline: { type: "string", description: "One-line product tagline (max 120 characters)." },
        screenshot_ids: {
          type: "array",
          items: { type: "string" },
          description: "Asset ids of the screenshots to show, in order. May be empty.",
        },
        accent_color: { type: "string", description: "Hex color for brand accents, e.g. #00e128." },
      },
      required: ["title", "tagline", "screenshot_ids"],
    },
  },
];

export type AgentEvent =
  | { type: "text"; content: string }
  | { type: "tool_call"; tool: "generate_voiceover" | "render_video" }
  | { type: "render_progress"; progress: number }
  | { type: "video_ready"; url: string }
  | { type: "cost"; cost: SessionCost }
  | { type: "done" }
  | { type: "error"; message: string };

interface RunAgentOptions {
  settings: Settings;
  history: Message[];
  assets: UploadedFile[];
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

function toBase64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function toClaudeMessages(history: Message[]): MessageParam[] {
  // Only the most recent batch of screenshots is sent as pixels; earlier ones are referenced
  // by id so follow-up turns don't pay for the same images again.
  const lastWithImages = history.findLast((m) => m.role === "user" && (m.images?.length ?? 0) > 0);

  const messages: MessageParam[] = [];
  for (const m of history) {
    if (m.role === "agent") {
      // The API expects the conversation to start with a user turn.
      if (messages.length === 0 || !m.content.trim()) continue;
      messages.push({ role: "assistant", content: m.content });
      continue;
    }
    const content: ContentBlockParam[] = [];
    for (const img of m.images ?? []) {
      content.push({ type: "text", text: `Screenshot asset id: ${img.id} (${img.name})` });
      if (m === lastWithImages) {
        content.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: toBase64(img.url) } });
      }
    }
    content.push({ type: "text", text: m.content || "(screenshots attached)" });
    messages.push({ role: "user", content });
  }
  return messages;
}

function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Your Anthropic API key was rejected. Check it in Settings.";
  if (err instanceof Anthropic.RateLimitError) return "Anthropic rate limit reached. Wait a moment and try again.";
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status ?? ""}: ${err.message}`;
  return err instanceof Error ? err.message : "Unknown error";
}

export async function runAgent({ settings, history, assets, onEvent, signal }: RunAgentOptions): Promise<void> {
  const model = MODELS.find((m) => m.id === settings.model) ?? MODELS[0];
  const client = new Anthropic({
    apiKey: settings.anthropicApiKey,
    // Bring-your-own-key app: the key is the visitor's own and never leaves their browser
    // except to call api.anthropic.com directly.
    dangerouslyAllowBrowser: true,
  });

  const cost: SessionCost = {
    claude: { inputTokens: 0, outputTokens: 0, usd: 0 },
    elevenlabs: { characters: 0, usd: 0 },
    total: 0,
  };
  const emitCost = () => {
    cost.total = cost.claude.usd + cost.elevenlabs.usd;
    onEvent({ type: "cost", cost: structuredClone(cost) });
  };

  const assetsById = new Map(assets.map((a) => [a.id, a]));
  const messages = toClaudeMessages(history);
  let voiceover: Voiceover | null = null;
  let voiceovers = 0;
  let renders = 0;

  // Server-side refusal fallback is available on Opus 5.5 and Sonnet 5.5.
  const fallback = model.id === "claude-haiku-5-5"
    ? {}
    : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = client.beta.messages.stream(
        {
          model: model.id,
          max_tokens: MAX_TOKENS_PER_CALL,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          output_config: { effort: "medium" },
          messages,
          ...fallback,
        },
        { signal }
      );
      stream.on("text", (text) => onEvent({ type: "text", content: text }));
      const message = await stream.finalMessage();

      cost.claude.inputTokens += message.usage.input_tokens;
      cost.claude.outputTokens += message.usage.output_tokens;
      cost.claude.usd +=
        (message.usage.input_tokens * model.inputPerMTok + message.usage.output_tokens * model.outputPerMTok) / 1_000_000;

      if (message.stop_reason === "refusal") {
        onEvent({ type: "text", content: "\n\nThe model declined this request." });
        break;
      }
      if (message.stop_reason === "max_tokens") {
        throw new Error("The response was cut off (max_tokens). Try a shorter description.");
      }

      const toolUses = message.content.filter((b): b is ToolUse => b.type === "tool_use");
      if (toolUses.length === 0) break;

      messages.push({ role: "assistant", content: message.content });

      const results: ToolResult[] = [];
      for (const toolUse of toolUses) {
        const result = await runTool(toolUse);
        results.push({ type: "tool_result", tool_use_id: toolUse.id, ...result });
      }
      messages.push({ role: "user", content: results });

      if (i === MAX_ITERATIONS - 1) {
        onEvent({ type: "text", content: "\n\nStopped: step limit reached for this run." });
      }
    }
    emitCost();
    onEvent({ type: "done" });
  } catch (err) {
    emitCost();
    if (signal?.aborted) return;
    onEvent({ type: "error", message: errorMessage(err) });
  }

  async function runTool(toolUse: ToolUse): Promise<{ content: string; is_error?: boolean }> {
    const input = (toolUse.input ?? {}) as Record<string, unknown>;
    const fail = (msg: string) => ({ content: JSON.stringify({ error: msg }), is_error: true });

    try {
      if (toolUse.name === "generate_voiceover") {
        const script = input.script;
        if (typeof script !== "string" || !script.trim()) return fail("script must be a non-empty string");
        const words = script.trim().split(/\s+/).length;
        if (words > MAX_SCRIPT_WORDS || script.length > MAX_SCRIPT_CHARS) {
          return fail(`script is too long (${words} words). Keep it under ${MAX_SCRIPT_WORDS} words.`);
        }
        if (voiceovers >= MAX_VOICEOVERS) return fail("voiceover limit for this run reached");
        voiceovers++;

        onEvent({ type: "tool_call", tool: "generate_voiceover" });
        voiceover = await generateVoiceover(script, settings.elevenLabsApiKey, settings.elevenLabsVoiceId, signal);
        cost.elevenlabs.characters += script.length;
        cost.elevenlabs.usd += script.length * ELEVENLABS_PER_CHAR;
        return { content: JSON.stringify({ ok: true, duration_seconds: Math.round(voiceover.durationInSeconds) }) };
      }

      if (toolUse.name === "render_video") {
        if (!voiceover) return fail("call generate_voiceover first");
        if (renders >= MAX_RENDERS) return fail("render limit for this run reached");
        const title = typeof input.title === "string" ? input.title.slice(0, 60) : "";
        const tagline = typeof input.tagline === "string" ? input.tagline.slice(0, 120) : "";
        if (!title) return fail("title is required");
        const ids = Array.isArray(input.screenshot_ids) ? input.screenshot_ids : [];
        const screenshots = ids
          .map((id) => (typeof id === "string" ? assetsById.get(id)?.url : undefined))
          .filter((url): url is string => Boolean(url));
        const accent = typeof input.accent_color === "string" && /^#[0-9a-fA-F]{6}$/.test(input.accent_color)
          ? input.accent_color
          : undefined;
        renders++;

        onEvent({ type: "tool_call", tool: "render_video" });
        const url = await renderVideo(
          { title, tagline, screenshots, voiceover_url: voiceover.url, accent_color: accent },
          voiceover.durationInSeconds,
          (progress) => onEvent({ type: "render_progress", progress }),
          signal
        );
        onEvent({ type: "video_ready", url });
        return { content: JSON.stringify({ ok: true }) };
      }

      return fail(`unknown tool: ${toolUse.name}`);
    } catch (err) {
      if (signal?.aborted) throw err;
      const msg = err instanceof Error ? err.message : "tool failed";
      onEvent({ type: "text", content: `\n\n⚠️ **${toolUse.name} error:** ${msg}\n` });
      return fail(msg);
    }
  }
}
