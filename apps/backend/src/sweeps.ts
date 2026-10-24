import { rateLimitRepository, refreshTokenService } from "./container.js";

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

const sweep = async (name: string, run: () => Promise<number>): Promise<void> => {
  try {
    const count = await run();
    if (count > 0) console.log(`[sweep] Removed ${count} expired ${name}.`);
  } catch (err) {
    console.warn(`[sweep] ${name} sweep failed.`, err);
  }
};

const runSweeps = (): void => {
  void sweep("refresh tokens", () => refreshTokenService.deleteExpired());
  void sweep("rate limits", () => rateLimitRepository.deleteExpired());
};

// Runs once at startup, then hourly; unref'd so it never keeps the process alive.
export const startSweeps = (): void => {
  runSweeps();
  setInterval(runSweeps, SWEEP_INTERVAL_MS).unref();
};
