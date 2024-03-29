import { promisifyAnimation } from '../utils/promisify-animation.js'

export const showSlide = (element?: Element | null, options?: KeyframeAnimationOptions) =>
  promisifyAnimation(
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
  )
export const hideSlide = (element?: Element | null, options?: KeyframeAnimationOptions) =>
  promisifyAnimation(
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
  )
export const fadeOut = (element?: Element | null, options?: KeyframeAnimationOptions) =>
  promisifyAnimation(element, [{ opacity: 1 }, { opacity: 0 }], {
    duration: 500,
    easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
    ...options,
  })
export const fadeIn = (element?: Element | null, options?: KeyframeAnimationOptions) =>
  promisifyAnimation(element, [{ opacity: 0 }, { opacity: 1 }], {
    duration: 500,
    easing: 'cubic-bezier(0.165, 0.840, 0.440, 1.000)',
    ...options,
  })
export const showParallax = (element?: Element | null, options?: KeyframeAnimationOptions) =>
  promisifyAnimation(
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
  )

export const collapse = (element?: Element | null, options?: KeyframeAnimationOptions) => {
  return promisifyAnimation(
    element,
    [
      { height: `${element?.scrollHeight}px`, opacity: 1 },
      { height: '0px', opacity: 0 },
    ],
    {
      duration: 500,
      easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
      fill: 'forwards',
      ...options,
    },
  )
}

export const expand = (element?: Element | null, options?: KeyframeAnimationOptions) => {
  return promisifyAnimation(
    element,
    [
      { height: '0px', opacity: 0 },
      { height: `${element?.scrollHeight}px`, opacity: 1 },
    ],
    {
      duration: 500,
      easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
      fill: 'forwards',
      ...options,
    },
  )
}
