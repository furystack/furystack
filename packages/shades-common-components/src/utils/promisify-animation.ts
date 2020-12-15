export const promisifyAnimation = async (
  el: Element | null,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options?: number | KeyframeAnimationOptions | undefined,
) =>
  new Promise((resolve, reject) => {
    if (!el) {
      return reject()
    }
    const animation = el.animate(keyframes, options)
    animation.onfinish = resolve
    animation.oncancel = reject
  })
