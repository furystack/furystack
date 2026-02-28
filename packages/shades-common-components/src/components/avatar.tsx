import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'
import { user as userIcon } from './icons/icon-definitions.js'

export type AvatarProps = { avatarUrl: string; fallback?: JSX.Element } & PartialElement<HTMLDivElement>

export const Avatar = Shade<AvatarProps>({
  shadowDomName: 'shade-avatar',
  css: {
    fontFamily: cssVariableTheme.typography.fontFamily,
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
      width: '100%',
      height: '100%',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 20%, transparent)`,
      backdropFilter: 'blur(10px)',
      textAlign: 'center',
      userSelect: 'none',
      lineHeight: '1',
    },
  },
  render: ({ props, useHostProps, useState }) => {
    const { style } = props
    const [hasError, setHasError] = useState('hasError', false)

    useHostProps({
      ...(style ? { style: style as Record<string, string> } : {}),
    })

    if (hasError) {
      return (
        <div className="avatar-fallback-container">
          <div className="avatar-fallback-icon">
            {props.fallback || (
              <svg
                width="100%"
                height="100%"
                viewBox={userIcon.viewBox ?? '0 0 24 24'}
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                {userIcon.paths.map((p) => (
                  <path d={p.d} />
                ))}
              </svg>
            )}
          </div>
        </div>
      )
    }

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
        onerror={() => {
          setHasError(true)
        }}
      />
    )
  },
})
