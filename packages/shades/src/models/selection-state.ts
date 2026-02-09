/**
 * Captures the current focus and selection range within a DOM subtree.
 * Used internally by the reconciler to preserve user selection across re-renders.
 */
export interface SelectionState {
  focusedPath?: number[]
  selectionRange?: {
    startOffset: number
    startContainerPath: number[]
    endOffset: number
    endContainerPath: number[]
  }
}
