"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_SETTINGS, MODELS, type ModelId, type Settings } from "@/lib/settings";

interface SettingsPanelProps {
  initial: Settings;
  onSave: (settings: Settings) => void;
  onClear: () => void;
  onClose?: () => void;
}

const inputClass =
  "w-full border-0 border-b border-[#333] bg-transparent py-2 text-sm text-white placeholder:text-[#444] font-[300] outline-none focus:border-[#00e128] transition-colors";
const labelClass = "text-[10px] tracking-widest uppercase text-[#555]";

export function SettingsPanel({ initial, onSave, onClear, onClose }: SettingsPanelProps) {
  const [draft, setDraft] = useState<Settings>(initial);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const canSave = draft.anthropicApiKey.trim() !== "" && draft.elevenLabsApiKey.trim() !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <form
        className="w-full max-w-md border border-[#222] bg-black p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave({ ...draft, anthropicApiKey: draft.anthropicApiKey.trim(), elevenLabsApiKey: draft.elevenLabsApiKey.trim() });
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-widest uppercase text-white">Your API keys</p>
          {onClose && (
            <button type="button" onClick={onClose} className="text-[#555] hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-[#666] leading-relaxed font-[300]">
          DemoVox runs entirely in your browser with your own keys. They are sent only to
          Anthropic and ElevenLabs, directly from this page, and usage is billed to your accounts.
          No server, no database.
        </p>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Anthropic API key</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
            placeholder="sk-ant-..."
            value={draft.anthropicApiKey}
            onChange={(e) => set("anthropicApiKey", e.target.value)}
          />
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-[10px] text-[#444] hover:text-[#888]">
            Get a key → console.anthropic.com
          </a>
        </label>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>ElevenLabs API key</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
            value={draft.elevenLabsApiKey}
            onChange={(e) => set("elevenLabsApiKey", e.target.value)}
          />
          <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-[#444] hover:text-[#888]">
            Get a key → elevenlabs.io
          </a>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Model</span>
            <select
              className={`${inputClass} [&>option]:bg-black`}
              value={draft.model}
              onChange={(e) => set("model", e.target.value as ModelId)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Voice ID</span>
            <input
              className={inputClass}
              spellCheck={false}
              value={draft.elevenLabsVoiceId}
              onChange={(e) => set("elevenLabsVoiceId", e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 accent-[#00e128]"
            checked={draft.remember}
            onChange={(e) => set("remember", e.target.checked)}
          />
          <span className="text-xs text-[#666] font-[300] leading-relaxed">
            Remember on this device. Off by default: keys are forgotten when you close the tab.
            Only enable this on a computer you trust.
          </span>
        </label>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_SETTINGS);
              onClear();
            }}
            className="text-[10px] tracking-widest uppercase text-[#444] hover:text-red-500 transition-colors"
          >
            Forget keys
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="border border-[#00e128] text-[#00e128] text-xs tracking-widest uppercase px-5 py-2 hover:bg-[#00e128] hover:text-black transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
