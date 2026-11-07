"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Message } from "@/types";
import Image from "next/image";

interface MessageListProps {
  messages: Message[];
  isThinking: boolean;
}

export function MessageList({ messages, isThinking }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <ScrollArea className="flex-1 px-5">
      <div className="flex flex-col gap-6 py-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>

            <span className="text-[10px] tracking-widest uppercase text-[#444] px-0.5">
              {msg.role === "user" ? "You" : "Agent"}
            </span>

            {/* Images */}
            {msg.images && msg.images.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {msg.images.map((img) => (
                  <div key={img.id} className="relative h-16 w-16 overflow-hidden border border-[#333]">
                    <Image src={img.url} alt={img.name} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`text-sm leading-relaxed font-[300] max-w-[85%] ${
                msg.role === "user"
                  ? "text-white border-l-0 border-r-2 border-[#00e128] pr-3"
                  : "text-[#ccc] border-l-2 border-[#333] pl-3"
              }`}
            >
              {msg.content}
            </div>

            {/* Pre-rendered at build time; the client clock and locale win. */}
            <span className="text-[10px] text-[#333] px-0.5" suppressHydrationWarning>
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex flex-col gap-2 items-start">
            <span className="text-[10px] tracking-widest uppercase text-[#444]">Agent</span>
            <div className="flex items-center gap-1.5 border-l-2 border-[#333] pl-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-[#00e128] animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
