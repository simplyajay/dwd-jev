import type { JevListItem, JournalType } from "@dwd-jev/shared";
import type { Api } from "./types";

// In-memory stand-in for the JEV list until it's wired to the backend.

const LATENCY_MS = 400;

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

const JOURNAL_TYPES: JournalType[] = ["crj", "cdj", "gj", "ckdj", "msij"];

const jevs: JevListItem[] = Array.from({ length: 36 }, (_, i) => {
  const month = (i % 12) + 1;
  const day = ((i * 7) % 27) + 1;
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return {
    id: crypto.randomUUID(),
    jevNumber: `2026-${pad(month)}-${pad(i + 1, 4)}`,
    journalType: JOURNAL_TYPES[i % JOURNAL_TYPES.length] ?? "gj",
    jevDate: `2026-${pad(month)}-${pad(day)}`,
  };
});

export const fakeJevsApi: Api["jevs"] = {
  async listByMonth({ year, month, page, pageSize }) {
    await delay();
    const matching = jevs
      .filter((jev) => {
        const [y, m] = jev.jevDate.split("-").map(Number);
        return y === year && (month === 0 || m === month);
      })
      .sort((a, b) => b.jevDate.localeCompare(a.jevDate));
    const start = (page - 1) * pageSize;
    return {
      items: matching.slice(start, start + pageSize),
      total: matching.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(matching.length / pageSize)),
    };
  },
};
