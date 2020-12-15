export interface SelectionState {
  focusedPath?: number[]
  selectionRange?: {
    startOffset: number
    startContainerPath: number[]
    endOffset: number
    endContainerPath: number[]
  }
}
