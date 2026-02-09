import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type AvatarProps = { avatarUrl: string; fallback?: JSX.Element } & PartialElement<HTMLDivElement>

export const Avatar = Shade<AvatarProps>({
  shadowDomName: 'shade-avatar',
  css: {
    width: '128px',
    height: '128px',
    overflow: 'hidden',
    borderRadius: cssVariableTheme.shape.borderRadius.full,
    boxShadow: cssVariableTheme.shadows.md,
    background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 10%, ${cssVariableTheme.background.paper})`,
    display: 'flex',
    position: 'relative',
    transition: `all ${cssVariableTheme.transitions.duration.slow} ${cssVariableTheme.transitions.easing.default}`,
    '&:hover': {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: cssVariableTheme.shadows.xl,
    },

    '& .avatar-fallback-container': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 15%, ${cssVariableTheme.background.paper})`,
    },

    '& .avatar-fallback-icon': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 20%, transparent)`,
      backdropFilter: 'blur(10px)',
      textAlign: 'center',
      userSelect: 'none',
      fontSize: '48px',
      lineHeight: '1',
    },
  },
  render: ({ props, useHostProps }) => {
    const { style } = props

    useHostProps({
      ...(style ? { style: style as Record<string, string> } : {}),
    })

    return (
      <img
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          transition: 'all 0.3s ease',
        }}
        alt={'avatar image'}
        src={props.avatarUrl}
        onerror={(ev) => {
          ;((ev as Event).target as HTMLImageElement).replaceWith(
            <div className="avatar-fallback-container">
              <div className="avatar-fallback-icon">{props.fallback || '🛑'}</div>
            </div>,
          )
        }}
      />
    )
  },
})
