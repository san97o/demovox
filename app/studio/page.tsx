"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { AssetPanel } from "@/components/studio/AssetPanel";
import { VideoPreview } from "@/components/studio/VideoPreview";
import { StatusBar } from "@/components/studio/StatusBar";
import { CostPanel } from "@/components/studio/CostPanel";
import { SettingsPanel } from "@/components/studio/SettingsPanel";
import { type Message, type UploadedFile, type AgentStep, type SessionCost } from "@/types";
import { saveCostRecord } from "@/lib/costStorage";
import { runAgent } from "@/lib/agent";
import { checkBrowserSupport } from "@/lib/render";
import { MAX_ASSETS } from "@/lib/images";
import { clearSettings, hasKeys, saveSettings, useSettings } from "@/lib/settings";

const SEED_MESSAGES: Message[] = [
  {
    id: "seed-1",
    role: "agent",
    content:
      "Ready. Describe the product you want to demo — what it does, who uses it, and what you want to highlight. Attach screenshots if you have them.",
    timestamp: new Date(),
  },
];

export default function StudioPage() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [allAssets, setAllAssets] = useState<UploadedFile[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [agentStep, setAgentStep] = useState<AgentStep>("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [sessionCost, setSessionCost] = useState<SessionCost | null>(null);
  const settings = useSettings();
  // null = automatic: open while no keys are set.
  const [settingsOpenState, setSettingsOpen] = useState<boolean | null>(null);
  const settingsOpen = settingsOpenState ?? !hasKeys(settings);
  const [browserIssue, setBrowserIssue] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkBrowserSupport().then(setBrowserIssue);
    return () => abortRef.current?.abort();
  }, []);

  const handleSend = useCallback(
    async (content: string, images: UploadedFile[]) => {
      if (!content && images.length === 0) return;
      if (!hasKeys(settings)) {
        setSettingsOpen(true);
        return;
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        timestamp: new Date(),
      };
      const agentMsgId = `agent-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: agentMsgId, role: "agent", content: "", timestamp: new Date() },
      ]);

      const assets = [...allAssets, ...images];
      if (images.length > 0) setAllAssets(assets);

      setIsThinking(true);
      setAgentStep("analyzing");
      setRenderProgress(0);

      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      let agentBuffer = "";
      const setAgentContent = (text: string) =>
        setMessages((prev) => prev.map((m) => (m.id === agentMsgId ? { ...m, content: text } : m)));

      await runAgent({
        settings,
        history: [...messages, userMsg],
        assets,
        signal: abort.signal,
        onEvent: (event) => {
          if (event.type === "text") {
            agentBuffer += event.content;
            setAgentContent(agentBuffer);
            setAgentStep((prev) => (prev === "analyzing" ? "scripting" : prev));
          } else if (event.type === "tool_call") {
            setAgentStep(event.tool === "generate_voiceover" ? "voiceover" : "rendering");
          } else if (event.type === "render_progress") {
            setRenderProgress(event.progress);
          } else if (event.type === "video_ready") {
            setVideoUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return event.url;
            });
            setAgentStep("done");
          } else if (event.type === "cost") {
            setSessionCost(event.cost);
            if (event.cost.total > 0) saveCostRecord(event.cost);
          } else if (event.type === "done") {
            setAgentStep((prev) => (prev === "done" ? "done" : "idle"));
          } else if (event.type === "error") {
            setAgentContent(`${agentBuffer}${agentBuffer ? "\n\n" : ""}Something went wrong: ${event.message}`);
            setAgentStep("idle");
          }
        },
      });

      setIsThinking(false);
    },
    [messages, allAssets, settings]
  );

  return (
    <div className="flex h-screen flex-col bg-black overflow-hidden">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#222] px-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[#555] hover:text-white transition-colors" aria-label="Back to home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-[#222]" />
          <span className="text-xs tracking-widest uppercase font-[400]">DemoVox Studio</span>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 text-xs tracking-wide uppercase text-[#555] hover:text-white transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {hasKeys(settings) ? "Keys" : "Add keys"}
          </button>
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full bg-[#00e128] ${isThinking ? "animate-pulse" : ""}`} />
            <span className="text-xs text-[#555] tracking-wide uppercase">{isThinking ? "Working" : "Ready"}</span>
          </div>
        </div>
      </header>

      {browserIssue && (
        <div className="border-b border-[#222] bg-[#1a0d00] px-5 py-2 text-xs text-[#d97706]">
          {browserIssue}
        </div>
      )}

      {/* Main split layout */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="h-1/2 md:h-auto md:w-[45%] shrink-0 overflow-hidden border-b md:border-b-0 md:border-r border-[#222]">
          <ChatPanel
            messages={messages}
            isThinking={isThinking}
            onSend={handleSend}
            remainingSlots={MAX_ASSETS - allAssets.length}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto p-6 gap-8">
            <AssetPanel assets={allAssets} />
            <div className="h-px bg-[#222]" />
            <CostPanel cost={sessionCost} />
            <div className="h-px bg-[#222]" />
            <VideoPreview agentStep={agentStep} videoUrl={videoUrl} renderProgress={renderProgress} />
          </div>
          <StatusBar currentStep={agentStep} />
        </div>
      </div>

      {settingsOpen && (
        <SettingsPanel
          initial={settings}
          onSave={(next) => {
            saveSettings(next);
            setSettingsOpen(false);
          }}
          onClear={() => {
            clearSettings();
            setSettingsOpen(true);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
