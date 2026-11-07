import { createBrowserStore } from "@/lib/browserStore";

// API keys belong to the person using the app. They live only in this browser
// and are sent only to api.anthropic.com and api.elevenlabs.io.
// Without "remember", they are kept in sessionStorage and cleared when the tab closes.

export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", inputPerMTok: 4, outputPerMTok: 20 },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", inputPerMTok: 2, outputPerMTok: 10 },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", inputPerMTok: 0.1, outputPerMTok: 0.5 },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export interface Settings {
  anthropicApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  model: ModelId;
  remember: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  anthropicApiKey: "",
  elevenLabsApiKey: "",
  elevenLabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
  model: "claude-opus-5-5",
  remember: false,
};

const KEY = "demovox:settings";

function read(storage: Storage): Settings | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;
    if (!MODELS.some((m) => m.id === parsed.model)) parsed.model = DEFAULT_SETTINGS.model;
    return parsed;
  } catch {
    return null;
  }
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  return read(window.sessionStorage) ?? read(window.localStorage) ?? DEFAULT_SETTINGS;
}

const store = createBrowserStore(loadSettings, DEFAULT_SETTINGS);
export const useSettings = store.use;

export function saveSettings(settings: Settings): void {
  store.set(settings);
  try {
    const raw = JSON.stringify(settings);
    window.sessionStorage.setItem(KEY, raw);
    if (settings.remember) window.localStorage.setItem(KEY, raw);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable (private mode): settings stay in memory for this page.
  }
}

export function clearSettings(): void {
  store.set(DEFAULT_SETTINGS);
  try {
    window.sessionStorage.removeItem(KEY);
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function hasKeys(settings: Settings): boolean {
  return settings.anthropicApiKey.trim() !== "" && settings.elevenLabsApiKey.trim() !== "";
}
