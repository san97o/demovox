export interface UploadedFile {
  id: string;
  name: string;
  url: string;       // data URL of the resized image, kept in browser memory only
  mediaType: "image/jpeg";
}

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  images?: UploadedFile[];
  timestamp: Date;
}

export type AgentStep =
  | "idle"
  | "analyzing"
  | "scripting"
  | "voiceover"
  | "rendering"
  | "done";

export interface SessionCost {
  claude: { inputTokens: number; outputTokens: number; usd: number };
  elevenlabs: { characters: number; usd: number };
  total: number;
}

export const AGENT_STEP_LABELS: Record<AgentStep, string> = {
  idle: "Ready",
  analyzing: "Analyzing your description...",
  scripting: "Writing the script...",
  voiceover: "Generating voiceover...",
  rendering: "Rendering video in your browser...",
  done: "Done!",
};
