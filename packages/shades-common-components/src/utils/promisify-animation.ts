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
    const animation = el.animate(keyframes, options)
    animation.onfinish = resolve
    animation.oncancel = reject
  })
