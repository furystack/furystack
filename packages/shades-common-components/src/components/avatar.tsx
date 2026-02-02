import type { PartialElement } from '@furystack/shades'
import { Shade, attachProps, createComponent } from '@furystack/shades'
import { cssVariableTheme } from '../services/css-variable-theme.js'

export type AvatarProps = { avatarUrl: string; fallback?: JSX.Element } & PartialElement<HTMLDivElement>

export const Avatar = Shade<AvatarProps>({
  shadowDomName: 'shade-avatar',
  css: {
    width: '128px',
    height: '128px',
    overflow: 'hidden',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
    background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 10%, ${cssVariableTheme.background.paper})`,
    display: 'flex',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.12)',
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
      borderRadius: '50%',
      background: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 20%, transparent)`,
      backdropFilter: 'blur(10px)',
      textAlign: 'center',
      userSelect: 'none',
      fontSize: '48px',
      lineHeight: '1',
    },
  },
  render: ({ props, element }) => {
    const { avatarUrl, ...containerProps } = props

    attachProps(element, {
      ...containerProps,
      style: {
        ...containerProps?.style,
      },
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
