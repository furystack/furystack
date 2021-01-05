export class AggregatedError extends Error {
  /**
   * @param message The error message
   * @param rejections Collection of the Rejections
   */
  constructor(message: string, public readonly rejections: PromiseRejectedResult[]) {
    super(message)
  }
}
