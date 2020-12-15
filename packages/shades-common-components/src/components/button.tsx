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

const getBorder = (buttonProps: ButtonProps, theme: Theme) =>
  buttonProps.variant === 'outlined'
    ? buttonProps.color
      ? `1px solid ${
          buttonProps.disabled ? theme.palette[buttonProps.color].dark : theme.palette[buttonProps.color].main
        }`
      : `1px solid ${buttonProps.disabled ? theme.button.disabledBackground : theme.text.secondary}`
    : 'none'

const getHoveredBorder = (buttonProps: ButtonProps, theme: Theme) =>
  buttonProps.variant === 'outlined'
    ? buttonProps.color
      ? `1px solid ${buttonProps.disabled ? theme.button.disabledBackground : theme.palette[buttonProps.color].light}`
      : `1px solid ${buttonProps.disabled ? theme.button.disabledBackground : theme.text.primary}`
    : 'none'

const getTextColor = (buttonProps: ButtonProps, theme: Theme, fallback: () => string) =>
  !buttonProps.variant
    ? buttonProps.color
      ? buttonProps.disabled
        ? theme.palette[buttonProps.color].dark
        : theme.palette[buttonProps.color].main
      : theme.text.secondary
    : fallback()

const getHoveredTextColor = (buttonProps: ButtonProps, theme: Theme, fallback: () => string) =>
  !buttonProps.variant
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
  constructed: ({ injector, updateState }) => {
    const observer = injector.getInstance(ThemeProviderService).theme.subscribe((theme) => {
      updateState({ theme })
    })
    return () => observer.dispose()
  },
  shadowDomName: 'shade-button',
  render: ({ props, children, getState, injector }) => {
    const { theme } = getState()
    const background = getBackground(props, theme)
    const hoveredBackground = getHoveredBackground(props, theme, () => {
      const { r, g, b } = injector
        .getInstance(ThemeProviderService)
        .getRgbFromColorString((props.color && theme.palette[props.color].main) || theme.text.primary)
      return `rgba(${r}, ${g}, ${b}, 0.1)`
    })
    const border = getBorder(props, theme)
    const hoveredBorder = getHoveredBorder(props, theme)
    const textColor = getTextColor(props, theme, () =>
      injector.getInstance(ThemeProviderService).getTextColor(background),
    )
    const hoveredTextColor = getHoveredTextColor(props, theme, () =>
      injector.getInstance(ThemeProviderService).getTextColor(background),
    )

    return (
      <button
        onmouseenter={(ev) => {
          {
            promisifyAnimation(
              ev.target as any,
              [
                {
                  background,
                  border,
                  color: textColor,
                },
                {
                  background: hoveredBackground,
                  border: hoveredBorder,
                  color: hoveredTextColor,
                },
              ],
              { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' },
            )
          }
        }}
        onmouseleave={(ev) => {
          promisifyAnimation(
            ev.target as any,
            [
              { background: hoveredBackground, border: hoveredBorder, color: hoveredTextColor },
              { background, border, color: textColor },
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
          border,
          margin: '8px',
          padding: '6px 16px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          color: textColor,
          ...props.style,
        }}>
        {children}
      </button>
    )
  },
})
