import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent, attachProps } from '@furystack/shades'

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
        boxShadow: '0px 0px 8px 3px rgba(128,128,128,0.2)',
        backgroundColor: 'rgba(128,128,128,0.3)',
        display: 'flex',
        ...containerProps?.style,
      },
    })

    return (
      <img
        style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundPosition: 'center' }}
        alt={'avatar image'}
        src={props.avatarUrl}
        onerror={(ev) => {
          ;((ev as Event).target as HTMLImageElement).replaceWith(
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}
            >
              <div
                style={{
                  textAlign: 'center',
                  userSelect: 'none',
                  fontSize: '32px',
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
