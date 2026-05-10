export type RetryPolicy = {
  maxAttempts: number
  backoff: 'exponential' | 'linear' | 'none'
  baseDelayMs: number
  /** Fraction of randomized jitter applied to the delay (0–1). */
  jitter: number
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 1,
  backoff: 'none',
  baseDelayMs: 0,
  jitter: 0,
}

/**
 * Computes the delay before the next retry attempt. The `randomSource`
 * parameter accepts a deterministic RNG during replay.
 */
export const calculateBackoff = (
  policy: RetryPolicy,
  attempt: number,
  randomSource: () => number = Math.random,
): number => {
  if (policy.backoff === 'none') return 0

  const base = policy.backoff === 'exponential' ? policy.baseDelayMs * 2 ** (attempt - 1) : policy.baseDelayMs * attempt

  const jitterRange = base * policy.jitter
  const jitter = jitterRange * (randomSource() * 2 - 1)

  return Math.max(0, Math.round(base + jitter))
}
