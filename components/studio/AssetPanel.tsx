"use client";

import { type UploadedFile } from "@/types";
import Image from "next/image";

interface AssetPanelProps {
  assets: UploadedFile[];
}

export function AssetPanel({ assets }: AssetPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest uppercase text-[#888] font-[400]">Assets</p>
        <span className="text-xs text-[#444]">{assets.length}</span>
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[#222] py-10 text-center">
          <p className="text-xs text-[#444] tracking-wide">
            No assets yet.<br />
            Upload via the chat input.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex flex-col gap-1">
              <div className="relative aspect-video overflow-hidden border border-[#222] bg-[#0d0d0d]">
                <Image
                  src={asset.url}
                  alt={asset.name}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="truncate text-[10px] text-[#444] font-[300]">
                {asset.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
