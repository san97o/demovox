import { createBrowserStore } from "@/lib/browserStore";
import type { SessionCost } from "@/types";

// Cost history is stored only in this browser (localStorage). Nothing is sent to a server.

export interface CostRecord {
  id: string;
  timestamp: number;
  cost: SessionCost;
}

const KEY = "demovox:costs";
const MAX_RECORDS = 500;

export function loadCostRecords(): CostRecord[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const store = createBrowserStore<CostRecord[]>(loadCostRecords, []);
export const useCostRecords = store.use;

export function saveCostRecord(cost: SessionCost): void {
  const records = [...loadCostRecords(), { id: crypto.randomUUID(), timestamp: Date.now(), cost }].slice(-MAX_RECORDS);
  store.set(records);
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // Storage unavailable: history is not kept.
  }
}

export function clearCostRecords(): void {
  store.set([]);
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function sumCosts(records: CostRecord[]): SessionCost {
  return records.reduce<SessionCost>(
    (acc, { cost }) => ({
      claude: {
        inputTokens: acc.claude.inputTokens + cost.claude.inputTokens,
        outputTokens: acc.claude.outputTokens + cost.claude.outputTokens,
        usd: acc.claude.usd + cost.claude.usd,
      },
      elevenlabs: {
        characters: acc.elevenlabs.characters + cost.elevenlabs.characters,
        usd: acc.elevenlabs.usd + cost.elevenlabs.usd,
      },
      total: acc.total + cost.total,
    }),
    {
      claude: { inputTokens: 0, outputTokens: 0, usd: 0 },
      elevenlabs: { characters: 0, usd: 0 },
      total: 0,
    }
  );
}
