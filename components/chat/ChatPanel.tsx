"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { type Message, type UploadedFile } from "@/types";

interface ChatPanelProps {
  messages: Message[];
  isThinking: boolean;
  onSend: (content: string, images: UploadedFile[]) => void;
  remainingSlots: number;
  disabled?: boolean;
}

export function ChatPanel({ messages, isThinking, onSend, remainingSlots, disabled }: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222] px-5 py-3">
        <p className="text-xs tracking-widest uppercase text-[#888] font-[400]">Agent</p>
        {isThinking && (
          <span className="text-[10px] tracking-widest uppercase text-[#00e128] animate-pulse">
            Processing
          </span>
        )}
      </div>

      <MessageList messages={messages} isThinking={isThinking} />
      <MessageInput onSend={onSend} disabled={isThinking || disabled} remainingSlots={remainingSlots} />
    </div>
  );
}
