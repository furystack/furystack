import type { DeepPartial } from '@furystack/utils'
import { getLuminance } from './get-luminance.js'
import { getRgbFromColorString } from './get-rgb-from-color-string.js'
import type { Theme } from './theme-provider-service.js'

export class CannotGetThemeModeError extends Error {
  constructor(public readonly theme: DeepPartial<Theme>) {
    super(
      `Cannot determine the theme mode for theme "${theme.name}" - Maybe background color or text color is missing, or cannot be recognized?`,
    )
  }
}

export const getThemeMode = (theme: DeepPartial<Theme>): 'light' | 'dark' => {
  const backgroundColor = theme.background?.default || theme?.background?.paper
  const textColor = theme.text?.primary

  if (!backgroundColor || !textColor) {
    throw new CannotGetThemeModeError(theme)
  }

  const bgLuminence = getLuminance(getRgbFromColorString(backgroundColor))
  const textLuminence = getLuminance(getRgbFromColorString(textColor))

  return textLuminence < bgLuminence ? 'light' : 'dark'
}
