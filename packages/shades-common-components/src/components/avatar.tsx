import type { PartialElement } from '@furystack/shades'
import { Shade, attachProps, createComponent } from '@furystack/shades'

export type AvatarProps = { avatarUrl: string; fallback?: JSX.Element } & PartialElement<HTMLDivElement>

export const Avatar = Shade<AvatarProps>({
  shadowDomName: 'shade-avatar',
  render: ({ props, element }) => {
    const { avatarUrl, ...containerProps } = props

    attachProps(element, {
      ...containerProps,
      style: {
        width: '128px',
        height: '128px',
        overflow: 'hidden',
        borderRadius: '50%',
        boxShadow:
          '0 0 0 3px rgba(255, 255, 255, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        display: 'flex',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...containerProps?.style,
      },
      onmouseenter: () => {
        element.style.transform = 'translateY(-2px) scale(1.02)'
        element.style.boxShadow =
          '0 0 0 3px rgba(255, 255, 255, 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
      },
      onmouseleave: () => {
        element.style.transform = 'translateY(0) scale(1)'
        element.style.boxShadow =
          '0 0 0 3px rgba(255, 255, 255, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center',
                  userSelect: 'none',
                  fontSize: '48px',
                  lineHeight: '1',
                }}
              >
                {props.fallback || '🛑'}
              </div>
            </div>,
          )
        }}
      />
    )
  },
})
