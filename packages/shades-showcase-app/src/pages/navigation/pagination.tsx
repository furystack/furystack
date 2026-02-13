import { createComponent, Shade } from '@furystack/shades'
import type { Palette } from '@furystack/shades-common-components'
import { Icon, icons, PageContainer, PageHeader, Pagination, Paper } from '@furystack/shades-common-components'

const paletteColors: Array<keyof Palette> = ['primary', 'secondary', 'error', 'warning', 'success', 'info']

export const PaginationPage = Shade({
  shadowDomName: 'shades-pagination-page',
  render: ({ useSearchState }) => {
    const [state, setState] = useSearchState('pagination', {
      basicPage: 1,
      colorPages: Object.fromEntries(paletteColors.map((c) => [c, 1])) as Record<keyof Palette, number>,
      smallPage: 1,
      largePage: 1,
      siblingPage: 5,
      boundaryPage: 5,
    })

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.file} />}
          title="Pagination"
          description="Pagination lets users navigate through pages of content. It supports palette colors, sizes, and configurable sibling/boundary counts."
        />

        <Paper elevation={3} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ margin: '0' }}>Basic</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <Pagination count={10} page={state.basicPage} onPageChange={(p) => setState({ ...state, basicPage: p })} />
          </div>

          <h3 style={{ margin: '0' }}>Colors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paletteColors.map((color) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ minWidth: '80px', textTransform: 'capitalize' }}>{color}</span>
                <Pagination
                  count={10}
                  page={state.colorPages[color]}
                  color={color}
                  onPageChange={(p) =>
                    setState({
                      ...state,
                      colorPages: { ...state.colorPages, [color]: p },
                    })
                  }
                />
              </div>
            ))}
          </div>

          <h3 style={{ margin: '0' }}>Sizes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '60px' }}>Small</span>
              <Pagination
                count={10}
                page={state.smallPage}
                size="small"
                color="primary"
                onPageChange={(p) => setState({ ...state, smallPage: p })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '60px' }}>Medium</span>
              <Pagination
                count={10}
                page={state.basicPage}
                color="primary"
                onPageChange={(p) => setState({ ...state, basicPage: p })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '60px' }}>Large</span>
              <Pagination
                count={10}
                page={state.largePage}
                size="large"
                color="primary"
                onPageChange={(p) => setState({ ...state, largePage: p })}
              />
            </div>
          </div>

          <h3 style={{ margin: '0' }}>Sibling & boundary count</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '180px' }}>siblingCount=0</span>
              <Pagination
                count={20}
                page={state.siblingPage}
                siblingCount={0}
                color="primary"
                onPageChange={(p) => setState({ ...state, siblingPage: p })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '180px' }}>siblingCount=2</span>
              <Pagination
                count={20}
                page={state.siblingPage}
                siblingCount={2}
                color="primary"
                onPageChange={(p) => setState({ ...state, siblingPage: p })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ minWidth: '180px' }}>boundaryCount=2</span>
              <Pagination
                count={20}
                page={state.boundaryPage}
                boundaryCount={2}
                color="primary"
                onPageChange={(p) => setState({ ...state, boundaryPage: p })}
              />
            </div>
          </div>

          <h3 style={{ margin: '0' }}>Disabled</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <Pagination count={10} page={3} onPageChange={() => {}} disabled color="primary" />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
