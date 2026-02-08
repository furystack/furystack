import { createComponent, Shade } from '@furystack/shades'
import type { Palette } from '@furystack/shades-common-components'
import { Icon, icons, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'
import type { IconDefinition } from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

type IconEntry = { name: string; icon: IconDefinition }

const categorizedIcons: Array<{ category: string; items: IconEntry[] }> = [
  {
    category: 'Status & Feedback',
    items: [
      { name: 'checkCircle', icon: icons.checkCircle },
      { name: 'errorCircle', icon: icons.errorCircle },
      { name: 'warning', icon: icons.warning },
      { name: 'info', icon: icons.info },
      { name: 'forbidden', icon: icons.forbidden },
      { name: 'searchOff', icon: icons.searchOff },
      { name: 'serverError', icon: icons.serverError },
    ],
  },
  {
    category: 'Navigation & Direction',
    items: [
      { name: 'chevronLeft', icon: icons.chevronLeft },
      { name: 'chevronRight', icon: icons.chevronRight },
      { name: 'chevronUp', icon: icons.chevronUp },
      { name: 'chevronDown', icon: icons.chevronDown },
      { name: 'arrowUp', icon: icons.arrowUp },
      { name: 'arrowDown', icon: icons.arrowDown },
      { name: 'arrowUpDown', icon: icons.arrowUpDown },
      { name: 'externalLink', icon: icons.externalLink },
    ],
  },
  {
    category: 'Actions & Controls',
    items: [
      { name: 'close', icon: icons.close },
      { name: 'check', icon: icons.check },
      { name: 'plus', icon: icons.plus },
      { name: 'minus', icon: icons.minus },
      { name: 'search', icon: icons.search },
      { name: 'zoomIn', icon: icons.zoomIn },
      { name: 'zoomOut', icon: icons.zoomOut },
      { name: 'rotate', icon: icons.rotate },
      { name: 'refresh', icon: icons.refresh },
      { name: 'filter', icon: icons.filter },
      { name: 'edit', icon: icons.edit },
      { name: 'trash', icon: icons.trash },
      { name: 'save', icon: icons.save },
      { name: 'download', icon: icons.download },
      { name: 'upload', icon: icons.upload },
      { name: 'cut', icon: icons.cut },
      { name: 'copy', icon: icons.copy },
      { name: 'paste', icon: icons.paste },
      { name: 'undo', icon: icons.undo },
      { name: 'redo', icon: icons.redo },
      { name: 'share', icon: icons.share },
      { name: 'link', icon: icons.link },
    ],
  },
  {
    category: 'Content & Files',
    items: [
      { name: 'file', icon: icons.file },
      { name: 'folder', icon: icons.folder },
      { name: 'folderOpen', icon: icons.folderOpen },
      { name: 'clipboard', icon: icons.clipboard },
      { name: 'packageIcon', icon: icons.packageIcon },
      { name: 'imageBroken', icon: icons.imageBroken },
      { name: 'inbox', icon: icons.inbox },
      { name: 'send', icon: icons.send },
    ],
  },
  {
    category: 'UI & Rating',
    items: [
      { name: 'star', icon: icons.star },
      { name: 'starOutline', icon: icons.starOutline },
      { name: 'heart', icon: icons.heart },
      { name: 'heartOutline', icon: icons.heartOutline },
      { name: 'eye', icon: icons.eye },
      { name: 'eyeOff', icon: icons.eyeOff },
      { name: 'menu', icon: icons.menu },
      { name: 'moreHorizontal', icon: icons.moreHorizontal },
      { name: 'moreVertical', icon: icons.moreVertical },
      { name: 'tag', icon: icons.tag },
      { name: 'pin', icon: icons.pin },
    ],
  },
  {
    category: 'Common',
    items: [
      { name: 'home', icon: icons.home },
      { name: 'user', icon: icons.user },
      { name: 'settings', icon: icons.settings },
      { name: 'bell', icon: icons.bell },
      { name: 'lock', icon: icons.lock },
      { name: 'unlock', icon: icons.unlock },
      { name: 'sun', icon: icons.sun },
      { name: 'moon', icon: icons.moon },
      { name: 'globe', icon: icons.globe },
      { name: 'calendar', icon: icons.calendar },
      { name: 'clock', icon: icons.clock },
      { name: 'play', icon: icons.play },
      { name: 'pause', icon: icons.pause },
    ],
  },
]

const iconCellStyle: Partial<CSSStyleDeclaration> = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '8px',
  minWidth: '80px',
}

export const IconsPage = Shade({
  tagName: 'shades-icons-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('icons', {
      selectedSize: 'medium' as 'small' | 'medium' | 'large',
      selectedColor: '' as string,
    })

    const size = state.selectedSize
    const color = (state.selectedColor || undefined) as keyof Palette | undefined

    return (
      <PageContainer maxWidth="1100px" centered>
        <PageHeader
          icon="⭐"
          title="Icons"
          description="A built-in icon set with stroke and fill variants. All icons are original SVG designs on a 24x24 grid. Use the Icon component with any icon definition."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Typography variant="h3" style={{ margin: '0' }}>
            Controls
          </Typography>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Typography variant="body1" style={{ margin: '0', fontWeight: '600' }}>
                Size:
              </Typography>
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button
                  onclick={() => setState({ ...state, selectedSize: s })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border:
                      size === s
                        ? '2px solid var(--shades-theme-palette-primary-main)'
                        : '1px solid var(--shades-theme-text-disabled)',
                    background:
                      size === s
                        ? 'color-mix(in srgb, var(--shades-theme-palette-primary-main) 15%, transparent)'
                        : 'transparent',
                    color: 'var(--shades-theme-text-primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--shades-theme-typography-font-family)',
                    fontSize: 'var(--shades-theme-typography-font-size-sm)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Typography variant="body1" style={{ margin: '0', fontWeight: '600' }}>
                Color:
              </Typography>
              <button
                onclick={() => setState({ ...state, selectedColor: '' })}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: !state.selectedColor
                    ? '2px solid var(--shades-theme-palette-primary-main)'
                    : '1px solid var(--shades-theme-text-disabled)',
                  background: !state.selectedColor
                    ? 'color-mix(in srgb, var(--shades-theme-palette-primary-main) 15%, transparent)'
                    : 'transparent',
                  color: 'var(--shades-theme-text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'var(--shades-theme-typography-font-family)',
                  fontSize: 'var(--shades-theme-typography-font-size-sm)',
                }}
              >
                inherit
              </button>
              {paletteColors.map((c) => (
                <button
                  onclick={() => setState({ ...state, selectedColor: c })}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '4px',
                    border:
                      state.selectedColor === c
                        ? '2px solid var(--shades-theme-palette-primary-main)'
                        : '1px solid var(--shades-theme-text-disabled)',
                    background:
                      state.selectedColor === c
                        ? 'color-mix(in srgb, var(--shades-theme-palette-primary-main) 15%, transparent)'
                        : 'transparent',
                    color: 'var(--shades-theme-text-primary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--shades-theme-typography-font-family)',
                    fontSize: 'var(--shades-theme-typography-font-size-sm)',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </Paper>

        {categorizedIcons.map(({ category, items }) => (
          <Paper
            elevation={3}
            style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
          >
            <Typography variant="h3" style={{ margin: '0' }}>
              {category}
            </Typography>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {items.map(({ name, icon }) => (
                <div style={iconCellStyle}>
                  <Icon icon={icon} size={size} color={color} />
                  <Typography
                    variant="caption"
                    style={{ margin: '0', textAlign: 'center', opacity: '0.7', fontSize: '11px' }}
                  >
                    {name}
                  </Typography>
                </div>
              ))}
            </div>
          </Paper>
        ))}

        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
        >
          <Typography variant="h3" style={{ margin: '0' }}>
            Size Comparison
          </Typography>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Icon icon={icons.home} size="small" />
              <Typography variant="caption" style={{ margin: '0' }}>
                small (16px)
              </Typography>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Icon icon={icons.home} size="medium" />
              <Typography variant="caption" style={{ margin: '0' }}>
                medium (24px)
              </Typography>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Icon icon={icons.home} size="large" />
              <Typography variant="caption" style={{ margin: '0' }}>
                large (32px)
              </Typography>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Icon icon={icons.home} size={48} />
              <Typography variant="caption" style={{ margin: '0' }}>
                custom (48px)
              </Typography>
            </div>
          </div>
        </Paper>

        <Paper
          elevation={3}
          style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}
        >
          <Typography variant="h3" style={{ margin: '0' }}>
            Color Palette
          </Typography>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {paletteColors.map((c) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Icon icon={icons.checkCircle} size="large" color={c} />
                <Typography variant="caption" style={{ margin: '0' }}>
                  {c}
                </Typography>
              </div>
            ))}
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
