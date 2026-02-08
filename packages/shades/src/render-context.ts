import type { ResourceManager } from './services/resource-manager.js'

let currentRenderContext: ResourceManager | null = null

/**
 * Sets the current render context to the given ResourceManager.
 * Called before executing a component's render function.
 * @param rm The ResourceManager for the currently rendering component
 */
export const setRenderContext = (rm: ResourceManager): void => {
  currentRenderContext = rm
}

/**
 * Clears the current render context.
 * Called after a component's render function completes (in a finally block).
 */
export const clearRenderContext = (): void => {
  currentRenderContext = null
}

/**
 * Gets the current render context (ResourceManager) if one is active.
 * Returns null if not currently inside a Shade render function.
 */
export const getRenderContext = (): ResourceManager | null => {
  return currentRenderContext
}
