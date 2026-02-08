import { createComponent, Shade } from '@furystack/shades'
import { Breadcrumb, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'

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
          <Typography variant="h3">Basic Breadcrumb</Typography>
          <Breadcrumb
            homeItem={{ path: '/' as const, label: 'Home' }}
            items={[{ path: '/data-display/breadcrumb', label: 'Breadcrumb' }]}
          />

          <Typography variant="h3">Multiple Items</Typography>
          <Breadcrumb
            items={[
              { path: '/' as const, label: 'Home' },
              { path: '/data-display' as const, label: 'Data Display' },
              { path: '/data-display/breadcrumb' as const, label: 'Breadcrumb' },
            ]}
          />

          <Typography variant="h3">Custom Separator</Typography>
          <Breadcrumb
            items={[
              { path: '/' as const, label: 'Home' },
              { path: '/data-display' as const, label: 'Data Display' },
              { path: '/data-display/breadcrumb' as const, label: 'Breadcrumb' },
            ]}
            separator=" → "
          />

          <Typography variant="h3">Custom Rendering</Typography>
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

          <Typography variant="h3">Last Item Non-Clickable (default)</Typography>
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
