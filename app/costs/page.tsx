"use client";

import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { clearCostRecords, sumCosts, useCostRecords, type CostRecord } from "@/lib/costStorage";

function fmt(usd: number) {
  if (usd === 0) return "$0.00";
  if (usd < 0.001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(4)}`;
}

function TotalRow({ label, usd, sub }: { label: string; usd: number; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-[#1a1a1a] last:border-0">
      <div>
        <span className="text-xs tracking-widest uppercase text-[#555]">{label}</span>
        {sub && <span className="ml-3 text-[10px] text-[#333]">{sub}</span>}
      </div>
      <span className="text-sm font-[200] tabular-nums text-[#888]">{fmt(usd)}</span>
    </div>
  );
}

function SessionRow({ record }: { record: CostRecord }) {
  const d = new Date(record.timestamp);
  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6 items-baseline py-3 border-b border-[#1a1a1a] last:border-0 text-xs">
      <span className="text-[#444]">{dateStr} {timeStr}</span>
      <span className="tabular-nums text-[#555]">{fmt(record.cost.claude.usd)}</span>
      <span className="tabular-nums text-[#555]">{fmt(record.cost.elevenlabs.usd)}</span>
      <span className="tabular-nums text-white font-[300]">{fmt(record.cost.total)}</span>
    </div>
  );
}

export default function CostsPage() {
  const records = useCostRecords();
  const totals = records.length > 0 ? sumCosts(records) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between border-b border-[#222] px-8 py-5">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[#555] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="h-4 w-px bg-[#222]" />
          <span className="text-xs tracking-widest uppercase font-[400]">Cost Overview</span>
        </div>
        {records.length > 0 && (
          <button
            onClick={clearCostRecords}
            className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#444] hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear history
          </button>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12 flex flex-col gap-12">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-[#555] mb-2">Estimated spend on this device</p>
          <p className="text-xs text-[#444] font-[300] mb-6">
            Stored only in this browser. Check your Anthropic and ElevenLabs dashboards for exact billing.
          </p>

          {totals ? (
            <>
              <div className="border border-[#1a1a1a] px-6 py-1 mb-6">
                <TotalRow
                  label="Claude"
                  usd={totals.claude.usd}
                  sub={`${totals.claude.inputTokens.toLocaleString()} in / ${totals.claude.outputTokens.toLocaleString()} out tokens`}
                />
                <TotalRow
                  label="ElevenLabs"
                  usd={totals.elevenlabs.usd}
                  sub={`${totals.elevenlabs.characters.toLocaleString()} chars`}
                />
              </div>
              <div className="flex items-baseline justify-between border-t border-[#222] pt-4">
                <div>
                  <span className="text-xs tracking-widest uppercase text-[#555]">Total</span>
                  <span className="ml-4 text-[10px] text-[#333]">{records.length} session{records.length !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-3xl font-[200] tracking-tight tabular-nums">{fmt(totals.total)}</span>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-[#222] py-16 flex items-center justify-center">
              <p className="text-xs text-[#333] tracking-wide">No sessions yet — run the agent to track costs.</p>
            </div>
          )}
        </div>

        {records.length > 0 && (
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#555] mb-6">Session history</p>
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-3 border-b border-[#222]">
              {["Time", "Claude", "ElevenLabs", "Total"].map((h) => (
                <span key={h} className="text-[10px] tracking-widest uppercase text-[#333]">{h}</span>
              ))}
            </div>
            {[...records].reverse().map((r) => (
              <SessionRow key={r.id} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
