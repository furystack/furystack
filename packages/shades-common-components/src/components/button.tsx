import type { PartialElement } from '@furystack/shades'
import { Shade, attachProps, createComponent } from '@furystack/shades'
import type { Palette, Theme } from '../services/theme-provider-service.js'
import { ThemeProviderService } from '../services/theme-provider-service.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'

export type ButtonProps = PartialElement<HTMLButtonElement> & {
  variant?: 'contained' | 'outlined'
  color?: keyof Palette
}

const getBackground = (buttonProps: ButtonProps, theme: Theme) =>
  buttonProps.variant === 'contained'
    ? buttonProps.color
      ? buttonProps.disabled
        ? theme.palette[buttonProps.color].dark
        : theme.palette[buttonProps.color].main
      : buttonProps.disabled
        ? theme.button.disabledBackground
        : theme.text.primary
    : 'rgba(0,0,0,0)'

const getHoveredBackground = (buttonProps: ButtonProps, theme: Theme, fallback: () => string) =>
  buttonProps.variant === 'contained'
    ? buttonProps.color
      ? theme.palette[buttonProps.color].dark
      : buttonProps.disabled
        ? theme.button.disabledBackground
        : theme.text.secondary
    : fallback()

const getBoxShadow = (buttonProps: ButtonProps, theme: Theme) =>
  buttonProps.variant === 'outlined'
    ? buttonProps.color
      ? `0px 0px 0px 1px ${
          buttonProps.disabled ? theme.palette[buttonProps.color].dark : theme.palette[buttonProps.color].main
        }`
      : `0px 0px 0px 1px ${buttonProps.disabled ? theme.button.disabledBackground : theme.text.secondary}`
    : 'none'

const getHoveredBoxShadow = (buttonProps: ButtonProps, theme: Theme) =>
  buttonProps.variant === 'outlined'
    ? buttonProps.color
      ? `0px 0px 0px 1px ${
          buttonProps.disabled ? theme.button.disabledBackground : theme.palette[buttonProps.color].light
        }`
      : `0px 0px 0px 1px ${buttonProps.disabled ? theme.button.disabledBackground : theme.text.primary}`
    : 'none'

const getTextColor = (buttonProps: ButtonProps, theme: Theme, fallback: () => string) =>
  buttonProps.variant !== 'contained'
    ? buttonProps.color
      ? buttonProps.disabled
        ? theme.palette[buttonProps.color].dark
        : theme.palette[buttonProps.color].main
      : theme.text.secondary
    : fallback()

const getHoveredTextColor = (buttonProps: ButtonProps, theme: Theme, fallback: () => string) =>
  buttonProps.variant !== 'contained'
    ? buttonProps.color
      ? buttonProps.disabled
        ? theme.palette[buttonProps.color].dark
        : theme.palette[buttonProps.color].light
      : theme.text.primary
    : fallback()

export const Button = Shade<ButtonProps>({
  shadowDomName: 'shade-button',
  elementBase: HTMLButtonElement,
  elementBaseName: 'button',
  constructed: ({ element }) => {
    /**
     * @param this The Document instance
     * @param ev The Mouse event
     */
    function mouseUp(this: Document, ev: MouseEvent) {
      if (ev.target === element) {
        void promisifyAnimation(
          element,
          [
            {
              filter: 'drop-shadow(1px 1px 10px rgba(0,0,0,.5))brightness(1)',
              transform: 'scale(1)',
            },
          ],
          { duration: 350, fill: 'forwards', easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' },
        )
      }
    }

    document.addEventListener('mouseup', mouseUp)

    return () => {
      document.removeEventListener('mouseup', mouseUp)
    }
  },
  render: ({ props, children, injector, element, useDisposable }) => {
    const mouseDownHandler = props.onmousedown
    const mouseUpHandler = props.onmouseup
    const themeProvider = injector.getInstance(ThemeProviderService)
    const { theme } = themeProvider
    const background = getBackground(props, theme)

    if (props.variant === 'contained') {
      useDisposable('themeChanged', () =>
        themeProvider.subscribe('themeChanged', () => {
          const el = element
          el.style.color = getTextColor(props, themeProvider.theme, () =>
            themeProvider.getTextColor(el.style.background || el.style.backgroundColor),
          )
        }),
      )
    }

    const hoveredBackground = getHoveredBackground(props, theme, () => {
      const { r, g, b } = themeProvider.getRgbFromColorString(
        (props.color && theme.palette[props.color].main) || theme.text.primary,
      )
      return `rgba(${r}, ${g}, ${b}, 0.1)`
    })
    const boxShadow = getBoxShadow(props, theme)
    const hoveredBoxShadow = getHoveredBoxShadow(props, theme)
    const getTextColorInner = () => getTextColor(props, theme, () => themeProvider.getTextColor(background))
    const getHoveredTextColorInner = () =>
      getHoveredTextColor(props, theme, () => themeProvider.getTextColor(background))

    const tryAnimate = async (
      keyframes: PropertyIndexedKeyframes | Keyframe[] | null,
      options?: number | KeyframeAnimationOptions,
    ) => {
      const el = element
      if (element) {
        void promisifyAnimation(el, keyframes, options)
      }
    }

    attachProps(element, {
      ...props,
      onmousedown(this: HTMLElement, ev: MouseEvent) {
        mouseDownHandler?.call(this, ev)
        void tryAnimate(
          [
            {
              filter: 'drop-shadow(-1px -1px 3px black)brightness(0.5)',
              transform: 'scale(0.98)',
            },
          ],
          { duration: 150, fill: 'forwards', easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' },
        )
      },
      onmouseup(this: HTMLElement, ev: MouseEvent) {
        mouseUpHandler?.call(this, ev)
      },
      onmouseenter: () => {
        void tryAnimate(
          [
            {
              background,
              boxShadow,
              color: getTextColorInner(),
            },
            {
              background: hoveredBackground,
              boxShadow: hoveredBoxShadow,
              color: getHoveredTextColorInner(),
            },
          ],
          { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' },
        )
      },
      onmouseout: () => {
        void tryAnimate(
          [
            { background: hoveredBackground, boxShadow: hoveredBoxShadow, color: getHoveredTextColorInner() },
            { background, boxShadow, color: getTextColorInner() },
          ],
          {
            duration: 500,
            fill: 'forwards',
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
          },
        )
      },
      ...props,
      style: {
        display: 'inline-flex',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        background,
        boxShadow,
        margin: '8px',
        padding: '6px 16px',
        border: 'none',
        borderRadius: '4px',
        textTransform: 'uppercase',
        color: getTextColorInner(),
        filter: 'drop-shadow(1px 1px 10px rgba(0,0,0,.5))',
        backdropFilter: props.variant === 'outlined' ? 'blur(35px)' : undefined,
        userSelect: 'none',
        ...props.style,
      },
    })

    return <>{children}</>
  },
})
