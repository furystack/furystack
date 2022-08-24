import { promisifyAnimation } from '../utils/promisify-animation'

export const animations = {
  showSlide: async (element?: Element | null, options?: KeyframeAnimationOptions) => {
    element &&
      (await promisifyAnimation(
        element,
        [
          { transform: 'translate(-350px, 0)scale(0)', opacity: 0 },
          { transform: 'translate(0, 0)scale(1)', opacity: 1 },
        ],
        {
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
          ...options,
        },
      ))
  },
  hideSlide: async (element?: Element | null, options?: KeyframeAnimationOptions) => {
    element &&
      (await promisifyAnimation(
        element,
        [
          { transform: 'translate(0, 0)scale(1)', opacity: 1 },
          { transform: 'translate(-350px, 0)scale(0)', opacity: 0 },
        ],
        {
          duration: 500,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
          ...options,
        },
      ))
  },
  fadeOut: async (element?: Element | null, options?: KeyframeAnimationOptions) => {
    element &&
      (await promisifyAnimation(element, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
        ...options,
      }))
  },
  fadeIn: async (element?: Element | null, options?: KeyframeAnimationOptions) => {
    element &&
      (await promisifyAnimation(element, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 500,
        easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
        ...options,
      }))
  },
  showParallax: async (element?: Element | null, options?: KeyframeAnimationOptions) => {
    element &&
      (await promisifyAnimation(
        element,
        [
          { transform: 'translate(50px, 0)', opacity: 0 },
          { transform: 'translate(0, 0)', opacity: 1 },
        ],
        {
          duration: 900,
          easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          fill: 'forwards',
          ...options,
        },
      ))
  },
}
