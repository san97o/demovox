"use client";

import { type SessionCost } from "@/types";

interface CostPanelProps {
  cost: SessionCost | null;
}

function fmt(usd: number) {
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(4)}`;
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-[#1a1a1a] last:border-0">
      <div>
        <span className="text-xs text-[#555] tracking-wide uppercase">{label}</span>
        {sub && <span className="ml-2 text-[10px] text-[#333]">{sub}</span>}
      </div>
      <span className="text-xs font-[300] text-[#888] tabular-nums shrink-0">{value}</span>
    </div>
  );
}

export function CostPanel({ cost }: CostPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs tracking-widest uppercase text-[#888] font-[400]">Estimated cost — last run</p>

      <div className="border border-[#1a1a1a] px-4 py-1">
        {cost ? (
          <>
            <Row
              label="Claude"
              value={fmt(cost.claude.usd)}
              sub={`${cost.claude.inputTokens.toLocaleString()} in / ${cost.claude.outputTokens.toLocaleString()} out`}
            />
            <Row
              label="ElevenLabs"
              value={fmt(cost.elevenlabs.usd)}
              sub={`${cost.elevenlabs.characters.toLocaleString()} chars`}
            />
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-[10px] text-[#333] tracking-wide">Billed to your own Anthropic and ElevenLabs accounts</p>
          </div>
        )}
      </div>

      {cost && (
        <div className="flex items-baseline justify-between border-t border-[#222] pt-3">
          <span className="text-xs tracking-widest uppercase text-[#555]">Total</span>
          <span className="text-sm font-[200] text-white tabular-nums">{fmt(cost.total)}</span>
        </div>
      )}
    </div>
  );
}
