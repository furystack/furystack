/**
 * Opaque handle returned by `ctx.spawnChild`. Carries the child's task id
 * and a phantom type parameter so `awaitChildren` can infer the result
 * tuple type at compile time.
 */
export type ChildHandle<TResult> = {
  readonly taskId: string
  readonly type: string
  /** Phantom field — never populated at runtime. */
  readonly __resultType?: TResult
}

/** Extracts the result type from a {@link ChildHandle}. */
export type ResultOf<THandle> = THandle extends ChildHandle<infer R> ? R : never
