import { createComponent, Shade } from '@furystack/shades'
import {
  Button,
  cssVariableTheme,
  DrawerToggleButton,
  Icon,
  icons,
  LayoutService,
  PageContainer,
  PageHeader,
  PageLayout,
  type PageLayoutProps,
  Typography,
} from '@furystack/shades-common-components'

type LayoutShowcaseEntry = {
  label: string
  description: string
  layoutProps: Omit<PageLayoutProps, 'contained'>
  content?: JSX.Element
}

const SampleAppBar = ({ label, color }: { label: string; color: string }) => (
  <div
    style={{
      background: color,
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '13px',
    }}
  >
    {label}
  </div>
)

const SampleDrawer = ({ label, color }: { label: string; color: string }) => (
  <div
    style={{
      background: color,
      height: '100%',
      boxSizing: 'border-box',
      padding: '12px',
      color: 'white',
      fontSize: '12px',
    }}
  >
    <strong>{label}</strong>
  </div>
)

const SampleContent = ({ text }: { text: string }) => (
  <div style={{ padding: '12px', fontSize: '13px' }}>
    <Typography variant="body2">{text}</Typography>
  </div>
)

const ToggleLeftDrawerButton = Shade({
  shadowDomName: 'showcase-toggle-left',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button
        variant="outlined"
        style={{ fontSize: '11px', padding: '4px 8px' }}
        onclick={() => layoutService.toggleDrawer('left')}
      >
        Toggle Drawer
      </Button>
    )
  },
})

const OpenTempDrawerButton = Shade({
  shadowDomName: 'showcase-open-temp-drawer',
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <Button
        variant="outlined"
        style={{ fontSize: '11px', padding: '4px 8px' }}
        onclick={() => layoutService.setDrawerOpen('left', true)}
      >
        Open Drawer
      </Button>
    )
  },
})

const ShowAppBarTab = Shade({
  shadowDomName: 'showcase-show-appbar-tab',
  css: {
    position: 'absolute',
    top: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: cssVariableTheme.zIndex.appBar,
    '& .appbar-hover-tab': {
      background: '#673ab7',
      color: 'white',
      fontSize: '10px',
      padding: '2px 16px',
      borderRadius: '0 0 6px 6px',
      cursor: 'pointer',
      opacity: '0.7',
      transition: 'opacity 0.2s',
    },
    '& .appbar-hover-tab:hover': {
      opacity: '1',
    },
  },
  render: ({ injector }) => {
    const layoutService = injector.getInstance(LayoutService)
    return (
      <div
        className="appbar-hover-tab"
        onmouseenter={() => layoutService.appBarVisible.setValue(true)}
        onmouseleave={() => layoutService.appBarVisible.setValue(false)}
      >
        ▼ hover to reveal ▼
      </div>
    )
  },
})

const getShowcaseEntries = (): LayoutShowcaseEntry[] => [
  {
    label: 'AppBar Only',
    description: 'Permanent AppBar with content area',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: <SampleAppBar label="Permanent AppBar" color="#e91e63" />,
      },
    },
  },
  {
    label: 'AppBar + Left Drawer',
    description: 'Permanent AppBar with a permanent left drawer',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: <SampleAppBar label="AppBar" color="#e91e63" />,
      },
      drawer: {
        left: {
          variant: 'permanent',
          width: '140px',
          component: <SampleDrawer label="Left Drawer" color="#2196f3" />,
        },
      },
    },
  },
  {
    label: 'AppBar + Right Drawer',
    description: 'Permanent AppBar with a permanent right drawer',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: <SampleAppBar label="AppBar" color="#e91e63" />,
      },
      drawer: {
        right: {
          variant: 'permanent',
          defaultOpen: true,
          width: '140px',
          component: <SampleDrawer label="Right Drawer" color="#4caf50" />,
        },
      },
    },
  },
  {
    label: 'Both Drawers',
    description: 'Permanent AppBar with both left and right drawers',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: <SampleAppBar label="AppBar" color="#e91e63" />,
      },
      drawer: {
        left: {
          variant: 'permanent',
          width: '120px',
          component: <SampleDrawer label="Left" color="#2196f3" />,
        },
        right: {
          defaultOpen: true,
          variant: 'permanent',
          width: '120px',
          component: <SampleDrawer label="Right" color="#4caf50" />,
        },
      },
    },
  },
  {
    label: 'Collapsible Drawer',
    description: 'Drawer that can be toggled open/closed',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: (
          <div
            style={{
              background: '#9c27b0',
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '4px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '13px',
              gap: '4px',
            }}
          >
            <DrawerToggleButton position="left" />
            <span>Collapsible</span>
          </div>
        ),
      },
      drawer: {
        left: {
          variant: 'collapsible',
          width: '140px',
          defaultOpen: true,
          component: <SampleDrawer label="Collapsible Drawer" color="#00bcd4" />,
        },
      },
    },
    content: <ToggleLeftDrawerButton />,
  },
  {
    label: 'Auto-Hide AppBar',
    description: 'AppBar hidden by default, visible on hover',
    layoutProps: {
      appBar: {
        variant: 'auto-hide',
        component: <SampleAppBar label="Auto-Hide AppBar (hover top)" color="#673ab7" />,
      },
    },
    content: <ShowAppBarTab />,
  },
  {
    label: 'Temporary Drawer',
    description: 'Drawer overlays content with a backdrop',
    layoutProps: {
      appBar: {
        variant: 'permanent',
        component: <SampleAppBar label="Temporary Drawer" color="#009688" />,
      },
      drawer: {
        left: {
          variant: 'temporary',
          width: '160px',
          defaultOpen: false,
          component: <SampleDrawer label="Temporary" color="#ff5722" />,
        },
      },
    },
    content: <OpenTempDrawerButton />,
  },
]

type LayoutShowcaseBlockProps = {
  entry: LayoutShowcaseEntry
}

const LayoutShowcaseBlock = Shade<LayoutShowcaseBlockProps>({
  shadowDomName: 'layout-showcase-block',
  render: ({ props }) => {
    return (
      <div
        style={{
          borderRadius: cssVariableTheme.shape.borderRadius.lg,
          boxShadow: cssVariableTheme.shadows.md,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.lg}`,
            background: cssVariableTheme.background.paper,
          }}
        >
          <Typography variant="h6" style={{ margin: '0 0 4px 0' }}>
            {props.entry.label}
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ margin: '0' }}>
            {props.entry.description}
          </Typography>
        </div>
        <div
          style={{
            position: 'relative',
            height: '300px',
            overflow: 'hidden',
            background: cssVariableTheme.background.default,
            borderTop: `1px solid ${cssVariableTheme.divider}`,
          }}
        >
          <PageLayout contained {...props.entry.layoutProps}>
            <SampleContent text="Main content area" />
            {props.entry.content}
          </PageLayout>
        </div>
      </div>
    )
  },
})

export const LayoutShowcasePage = Shade({
  shadowDomName: 'layout-showcase-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.ruler} />}
          title="Layout Showcase"
          description="Browse different PageLayout configurations. Each block renders a contained PageLayout instance with its own scoped LayoutService and CSS variables."
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: cssVariableTheme.spacing.xl,
            padding: `0 0 ${cssVariableTheme.spacing.xl} 0`,
          }}
        >
          {getShowcaseEntries().map((entry) => (
            <LayoutShowcaseBlock entry={entry} />
          ))}
        </div>
      </PageContainer>
    )
  },
})
