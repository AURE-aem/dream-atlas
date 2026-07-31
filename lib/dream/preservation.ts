export const MIN_PRESERVATION_VISIBLE_MS = 2600;

type WaitForMinimumDurationInput = {
  startedAt: number;
  minimumDurationMs: number;
  signal?: AbortSignal;
  now?: () => number;
};

export function getRemainingPreservationTime({
  startedAt,
  minimumDurationMs,
  now = () => performance.now(),
}: Omit<WaitForMinimumDurationInput, "signal">): number {
  return Math.max(0, minimumDurationMs - (now() - startedAt));
}

export async function waitForMinimumDuration({
  startedAt,
  minimumDurationMs,
  signal,
  now = () => performance.now(),
}: WaitForMinimumDurationInput): Promise<void> {
  if (signal?.aborted) return;

  const remainingMs = getRemainingPreservationTime({
    startedAt,
    minimumDurationMs,
    now,
  });

  if (remainingMs === 0) return;

  await new Promise<void>((resolve) => {
    const finish = () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", finish);
      resolve();
    };
    const timeoutId = globalThis.setTimeout(finish, remainingMs);

    signal?.addEventListener("abort", finish, { once: true });
  });
}
