import { Shade, createComponent, PartialElement } from '@furystack/shades'

export type AvatarProps = { avatarUrl: string } & PartialElement<HTMLDivElement>

export const Avatar = Shade<AvatarProps>({
  shadowDomName: 'shade-avatar',
  render: ({ props }) => {
    const { ...divProps } = props
    return (
      <div
        {...divProps}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '50%',
          boxShadow: '0px 0px 8px 3px rgba(128,128,128,0.2)',
          backgroundColor: 'rgba(128,128,128,0.3)',
          ...(props.style || {}),
        }}>
        <img
          style={{ width: '100%', height: '100%' }}
          alt={'avatar image'}
          src={props.avatarUrl}
          onerror={(ev) => {
            ;((ev as Event).target as HTMLImageElement).replaceWith(
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div
                  style={{
                    fontVariant: 'all-petite-caps',
                    fontSize: '2em',
                    height: 'calc(100% + 7px)',
                    cursor: 'default',
                    userSelect: 'none',
                  }}
                />
              </div>,
            )
          }}
        />
      </div>
    )
  },
})
