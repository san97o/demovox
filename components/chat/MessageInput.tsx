"use client";

import { useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { type UploadedFile } from "@/types";
import { MAX_ASSETS, prepareImage } from "@/lib/images";
import Image from "next/image";

interface MessageInputProps {
  onSend: (content: string, images: UploadedFile[]) => void;
  disabled?: boolean;
  remainingSlots: number;
}

export function MessageInput({ onSend, disabled, remainingSlots }: MessageInputProps) {
  const [text, setText] = useState("");
  const [pendingImages, setPendingImages] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && pendingImages.length === 0) return;
    onSend(trimmed, pendingImages);
    setText("");
    setPendingImages([]);
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    const slots = remainingSlots - pendingImages.length;
    if (files.length > slots) {
      setError(`You can attach up to ${MAX_ASSETS} screenshots per session.`);
    } else {
      setError(null);
    }

    // Resize locally; images stay in this browser.
    setProcessing(true);
    try {
      const prepared = await Promise.all(files.slice(0, Math.max(0, slots)).map(prepareImage));
      setPendingImages((prev) => [...prev, ...prepared]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image");
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (id: string) => {
    setPendingImages((prev) => prev.filter((f) => f.id !== id));
  };

  const isDisabled = disabled || processing;
  const canSend = (text.trim() || pendingImages.length > 0) && !isDisabled;

  return (
    <div className="border-t border-[#222] bg-black px-5 py-4 flex flex-col gap-3">
      {/* Image previews */}
      {pendingImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pendingImages.map((img) => (
            <div
              key={img.id}
              className="group relative h-12 w-12 overflow-hidden border border-[#333]"
            >
              <Image src={img.url} alt={img.name} fill className="object-cover" />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          className="shrink-0 text-[#555] hover:text-[#888] transition-colors disabled:opacity-30 mb-0.5"
          title="Attach images"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the video you want to create..."
          disabled={isDisabled}
          rows={1}
          className="min-h-[36px] max-h-[120px] flex-1 resize-none border-0 border-b border-[#333] rounded-none bg-transparent text-sm text-white placeholder:text-[#444] font-[300] focus-visible:ring-0 focus-visible:border-[#00e128] transition-colors px-0"
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 text-[#555] hover:text-[#00e128] transition-colors disabled:opacity-30 mb-0.5"
          title="Send (Enter)"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className={`text-[10px] tracking-wide ${error ? "text-red-500" : "text-[#333]"}`}>
        {error ?? (processing ? "Preparing images..." : "Shift + Enter for new line")}
      </p>
    </div>
  );
}
