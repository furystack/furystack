import { createComponent, Shade } from '@furystack/shades'
import { Breadcrumb, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const BreadcrumbPage = Shade({
  shadowDomName: 'shades-breadcrumb-page',
  render: () => {
    return (
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🍞"
          title="Breadcrumb"
          description="Breadcrumb navigation with customizable separators and rendering."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <h3>Basic Breadcrumb</h3>
          <Breadcrumb
            homeItem={{ path: '/' as const, label: 'Home' }}
            items={[{ path: '/data-display/breadcrumb', label: 'Breadcrumb' }]}
          />

          <h3>Multiple Items</h3>
          <Breadcrumb
            items={[
              { path: '/' as const, label: 'Home' },
              { path: '/data-display' as const, label: 'Data Display' },
              { path: '/data-display/breadcrumb' as const, label: 'Breadcrumb' },
            ]}
          />

          <h3>Custom Separator</h3>
          <Breadcrumb
            items={[
              { path: '/' as const, label: 'Home' },
              { path: '/data-display' as const, label: 'Data Display' },
              { path: '/data-display/breadcrumb' as const, label: 'Breadcrumb' },
            ]}
            separator=" → "
          />

          <h3>Custom Rendering</h3>
          <Breadcrumb
            items={[
              {
                path: '/' as const,
                label: 'Home',
                render: (item, isActive) => (
                  <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                    🏠 {item.label}
                  </span>
                ),
              },
              {
                path: '/data-display/breadcrumb' as const,
                label: 'Breadcrumb',
                render: (item, isActive) => (
                  <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? 'var(--primary)' : '' }}>
                    🍞 {item.label}
                  </span>
                ),
              },
            ]}
            separator=" › "
            lastItemClickable={true}
          />

          <h3>Last Item Non-Clickable (default)</h3>
          <Breadcrumb
            items={[
              { path: '/' as const, label: 'Home' },
              { path: '/data-display/breadcrumb' as const, label: 'Breadcrumb (not clickable)' },
            ]}
            lastItemClickable={false}
          />
        </Paper>
      </PageContainer>
    )
  },
})
