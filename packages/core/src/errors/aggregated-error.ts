/**
 * Error wrapper that carries the original rejections alongside a single
 * summary message. Use when an operation has fan-out failures that must all
 * be reported (e.g. parallel disposal where every failure should surface).
 */
export class AggregatedError extends Error {
  constructor(
    message: string,
    public readonly rejections: unknown[],
  ) {
    super(message)
  }
}
