/**
 * @param el The element to animate
 * @param keyframes A list of keyframe definitions
 * @param options Animation options
 * @returns A promise that resolves when the animation is complete or rejects if cancelled
 */
export const promisifyAnimation = async (
  el: Element | null | undefined,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: number | KeyframeAnimationOptions,
) =>
  new Promise<AnimationPlaybackEvent>((resolve, reject) => {
    if (!el) {
      return reject(new Error('No element provided'))
    }
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const resolvedOptions: KeyframeAnimationOptions =
      typeof options === 'number' ? { duration: options } : { ...options }
    if (prefersReducedMotion) {
      resolvedOptions.duration = 0
    }
    const animation = el.animate(keyframes, resolvedOptions)
    animation.onfinish = resolve
    animation.oncancel = reject
  })
