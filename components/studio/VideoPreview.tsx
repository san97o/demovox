"use client";

import { Download } from "lucide-react";
import { type AgentStep } from "@/types";

interface VideoPreviewProps {
  videoUrl?: string;
  agentStep: AgentStep;
  renderProgress: number;
}

export function VideoPreview({ videoUrl, agentStep, renderProgress }: VideoPreviewProps) {
  const isDone = agentStep === "done" && videoUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest uppercase text-[#888] font-[400]">Preview</p>
        {isDone && (
          <a
            href={videoUrl}
            download="demo.mp4"
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-[#00e128] hover:text-white transition-colors"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        )}
      </div>

      {/* Preview box */}
      <div className="relative aspect-video w-full border border-[#222] bg-[#0d0d0d] overflow-hidden">
        {isDone ? (
          <video src={videoUrl} controls className="h-full w-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Cross-hair decoration */}
            <div className="relative h-12 w-12 flex items-center justify-center">
              <div className="absolute inset-0 border border-[#222]" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#222]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#222]" />
              <div className="h-1.5 w-1.5 bg-[#333]" />
            </div>
            <p className="text-[10px] tracking-widest uppercase text-[#444]">
              {agentStep === "rendering"
                ? `Rendering ${Math.round(renderProgress * 100)}% — keep this tab open`
                : "Video output"}
            </p>
            <button
              disabled
              className="flex items-center gap-1.5 border border-[#222] text-[10px] tracking-widest uppercase text-[#333] px-4 py-2 cursor-not-allowed"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
