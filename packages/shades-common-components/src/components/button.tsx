import { Shade, createComponent, PartialElement } from '@furystack/shades'
import { promisifyAnimation } from '../utils/promisify-animation'
import { Palette, Theme, ThemeProviderService } from '../services/theme-provider-service'

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

export const Button = Shade<ButtonProps, { theme: Theme }>({
  getInitialState: ({ injector }) => ({
    theme: injector.getInstance(ThemeProviderService).theme.getValue(),
  }),
  constructed: ({ injector, updateState, element }) => {
    const observer = injector.getInstance(ThemeProviderService).theme.subscribe((theme) => {
      updateState({ theme })
    })

    const mouseUp = () =>
      promisifyAnimation(
        element.firstChild as Element,
        [
          {
            filter: 'drop-shadow(1px 1px 10px rgba(0,0,0,.5))brightness(1)',
            transform: 'scale(1)',
          },
        ],
        { duration: 350, fill: 'forwards', easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' },
      )

    document.addEventListener('mouseup', mouseUp)

    return () => {
      observer.dispose()
      document.removeEventListener('mouseup', mouseUp)
    }
  },
  shadowDomName: 'shade-button',
  render: ({ props, children, getState, injector }) => {
    const mouseDownHandler = props.onmousedown
    const mouseUpHandler = props.onmouseup
    const { theme } = getState()
    const background = getBackground(props, theme)
    const hoveredBackground = getHoveredBackground(props, theme, () => {
      const { r, g, b } = injector
        .getInstance(ThemeProviderService)
        .getRgbFromColorString((props.color && theme.palette[props.color].main) || theme.text.primary)
      return `rgba(${r}, ${g}, ${b}, 0.1)`
    })
    const boxShadow = getBoxShadow(props, theme)
    const hoveredBoxShadow = getHoveredBoxShadow(props, theme)
    const textColor = getTextColor(props, theme, () =>
      injector.getInstance(ThemeProviderService).getTextColor(background),
    )
    const hoveredTextColor = getHoveredTextColor(props, theme, () =>
      injector.getInstance(ThemeProviderService).getTextColor(background),
    )
    return (
      <button
        onmousedown={function (ev) {
          mouseDownHandler?.call(this, ev)
          promisifyAnimation(
            ev.currentTarget as Element,
            [
              {
                filter: 'drop-shadow(-1px -1px 3px black)brightness(0.5)',
                transform: 'scale(0.98)',
              },
            ],
            { duration: 250, fill: 'forwards', easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)' },
          )
        }}
        onmouseup={function (ev) {
          mouseUpHandler?.call(this, ev)
        }}
        onmouseenter={(ev) => {
          {
            promisifyAnimation(
              ev.target as any,
              [
                {
                  background,
                  boxShadow,
                  color: textColor,
                },
                {
                  background: hoveredBackground,
                  boxShadow: hoveredBoxShadow,
                  color: hoveredTextColor,
                },
              ],
              { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' },
            )
          }
        }}
        onmouseout={(ev) => {
          promisifyAnimation(
            ev.target as any,
            [
              { background: hoveredBackground, boxShadow: hoveredBoxShadow, color: hoveredTextColor },
              { background, boxShadow, color: textColor },
            ],
            {
              duration: 500,
              fill: 'forwards',
              easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
            },
          )
        }}
        {...props}
        style={{
          cursor: props.disabled ? 'inherits' : 'pointer',
          background,
          boxShadow,
          margin: '8px',
          padding: '6px 16px',
          border: 'none',
          borderRadius: '4px',
          textTransform: 'uppercase',
          color: textColor,
          filter: 'drop-shadow(1px 1px 10px rgba(0,0,0,.5))',
          backdropFilter: props.variant === 'outlined' ? 'blur(35px)' : undefined,
          ...props.style,
        }}
      >
        {children}
      </button>
    )
  },
})
