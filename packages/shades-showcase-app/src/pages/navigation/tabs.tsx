import {
  createComponent,
  createNestedHooks,
  createNestedNavigate,
  createNestedRouteLink,
  LocationService,
  Shade,
} from '@furystack/shades'
import {
  Button,
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Tabs,
  Typography,
  type Tab,
} from '@furystack/shades-common-components'

import { appRoutes } from '../../routes.js'

const AppLink = createNestedRouteLink<typeof appRoutes>()
const appNavigate = createNestedNavigate<typeof appRoutes>()
const { getTypedQuery, getTypedHash } = createNestedHooks(appRoutes)

const TypedRouteDemo = Shade({
  customElementName: 'typed-route-demo',
  render: ({ injector, useObservable }) => {
    const locationService = injector.get(LocationService)
    useObservable('tabsHash', locationService.onLocationHashChanged)
    useObservable('tabsSearch', locationService.onDeserializedLocationSearchChanged)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Typography variant="body1">
          The <code>/navigation/tabs</code> route declares a readonly literal tuple of allowed hash values and a query
          validator. The links and navigate helpers below are constrained to those declarations at compile time.
        </Typography>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AppLink path="/navigation/tabs" hash="ctrl-1">
            <Button variant="outlined">#ctrl-1</Button>
          </AppLink>
          <AppLink path="/navigation/tabs" hash="ctrl-2">
            <Button variant="outlined">#ctrl-2</Button>
          </AppLink>
          <AppLink path="/navigation/tabs" hash="ctrl-3" query={{ highlight: 'api-keys' }}>
            <Button variant="outlined">#ctrl-3 with highlight</Button>
          </AppLink>
          <Button
            variant="outlined"
            onclick={() => appNavigate(injector, { path: '/navigation/tabs', hash: 'ctrl-2' })}
          >
            Navigate programmatically
          </Button>
        </div>
        <Paper elevation={1} style={{ padding: '12px', fontFamily: 'Source Code Pro, monospace', fontSize: '13px' }}>
          <div>
            <strong>getTypedHash:</strong> {JSON.stringify(getTypedHash(injector, '/navigation/tabs'))}
          </div>
          <div>
            <strong>getTypedQuery:</strong> {JSON.stringify(getTypedQuery(injector, '/navigation/tabs'))}
          </div>
        </Paper>
      </div>
    )
  },
})

const ControlledTabsDemo = Shade({
  customElementName: 'controlled-tabs-demo',
  render: ({ useState }) => {
    const [activeKey, setActiveKey] = useState('activeKey', 'ctrl-1')

    return (
      <div>
        <div style={{ marginBottom: '8px', fontSize: '14px', opacity: '0.7' }}>
          Active key: <strong>{activeKey}</strong>
        </div>
        <Tabs
          activeKey={activeKey}
          onTabChange={(key) => setActiveKey(key)}
          tabs={[
            {
              hash: 'ctrl-1',
              header: <span>Dashboard</span>,
              component: <Paper style={{ padding: '16px' }}>Dashboard content with charts and metrics</Paper>,
            },
            {
              hash: 'ctrl-2',
              header: <span>Settings</span>,
              component: <Paper style={{ padding: '16px' }}>Application settings and preferences</Paper>,
            },
            {
              hash: 'ctrl-3',
              header: <span>Profile</span>,
              component: <Paper style={{ padding: '16px' }}>User profile information</Paper>,
            },
          ]}
        />
      </div>
    )
  },
})

const CardTabsDemo = Shade({
  customElementName: 'card-tabs-demo',
  render: ({ useState }) => {
    const [activeKey, setActiveKey] = useState('activeKey', 'card-1')

    return (
      <Tabs
        type="card"
        activeKey={activeKey}
        onTabChange={(key) => setActiveKey(key)}
        tabs={[
          {
            hash: 'card-1',
            header: <span>Overview</span>,
            component: <Paper style={{ padding: '16px' }}>Overview content</Paper>,
          },
          {
            hash: 'card-2',
            header: <span>Details</span>,
            component: <Paper style={{ padding: '16px' }}>Detailed information</Paper>,
          },
          {
            hash: 'card-3',
            header: <span>History</span>,
            component: <Paper style={{ padding: '16px' }}>History log</Paper>,
          },
        ]}
      />
    )
  },
})

const VerticalTabsDemo = Shade({
  customElementName: 'vertical-tabs-demo',
  render: ({ useState }) => {
    const [activeKey, setActiveKey] = useState('activeKey', 'vert-1')

    return (
      <Tabs
        orientation="vertical"
        activeKey={activeKey}
        onTabChange={(key) => setActiveKey(key)}
        containerStyle={{ height: '200px' }}
        tabs={[
          {
            hash: 'vert-1',
            header: <span>General</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>General settings panel</Paper>,
          },
          {
            hash: 'vert-2',
            header: <span>Security</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>Security settings panel</Paper>,
          },
          {
            hash: 'vert-3',
            header: <span>Notifications</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>Notification preferences</Paper>,
          },
        ]}
      />
    )
  },
})

const VerticalCardTabsDemo = Shade({
  customElementName: 'vertical-card-tabs-demo',
  render: ({ useState }) => {
    const [activeKey, setActiveKey] = useState('activeKey', 'vcard-1')

    return (
      <Tabs
        orientation="vertical"
        type="card"
        activeKey={activeKey}
        onTabChange={(key) => setActiveKey(key)}
        containerStyle={{ height: '200px' }}
        tabs={[
          {
            hash: 'vcard-1',
            header: <span>Account</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>Account details</Paper>,
          },
          {
            hash: 'vcard-2',
            header: <span>Billing</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>Billing information</Paper>,
          },
          {
            hash: 'vcard-3',
            header: <span>API Keys</span>,
            component: <Paper style={{ padding: '16px', flex: '1' }}>API key management</Paper>,
          },
        ]}
      />
    )
  },
})

const ViewTransitionTabsDemo = Shade({
  customElementName: 'view-transition-tabs-demo',
  render: ({ useState }) => {
    const [activeKey, setActiveKey] = useState('activeKey', 'vt-1')

    return (
      <Tabs
        viewTransition
        activeKey={activeKey}
        onTabChange={(key) => setActiveKey(key)}
        tabs={[
          {
            hash: 'vt-1',
            header: <span>Photos</span>,
            component: (
              <Paper style={{ padding: '24px', minHeight: '120px' }}>
                <Typography variant="h4">Photo Gallery</Typography>
                <Typography variant="body1" style={{ marginTop: '8px' }}>
                  Browse your uploaded photos and albums.
                </Typography>
              </Paper>
            ),
          },
          {
            hash: 'vt-2',
            header: <span>Videos</span>,
            component: (
              <Paper style={{ padding: '24px', minHeight: '120px' }}>
                <Typography variant="h4">Video Library</Typography>
                <Typography variant="body1" style={{ marginTop: '8px' }}>
                  Watch and manage your video collection.
                </Typography>
              </Paper>
            ),
          },
          {
            hash: 'vt-3',
            header: <span>Music</span>,
            component: (
              <Paper style={{ padding: '24px', minHeight: '120px' }}>
                <Typography variant="h4">Music Player</Typography>
                <Typography variant="body1" style={{ marginTop: '8px' }}>
                  Listen to your favorite tracks and playlists.
                </Typography>
              </Paper>
            ),
          },
        ]}
      />
    )
  },
})

const ClosableTabsDemo = Shade({
  customElementName: 'closable-tabs-demo',
  render: ({ useState }) => {
    let nextId = 4
    const [tabs, setTabs] = useState<Tab[]>('tabs', [
      {
        hash: 'file-1',
        header: <span>index.ts</span>,
        component: <Paper style={{ padding: '16px' }}>Content of index.ts</Paper>,
        closable: true,
      },
      {
        hash: 'file-2',
        header: <span>app.tsx</span>,
        component: <Paper style={{ padding: '16px' }}>Content of app.tsx</Paper>,
        closable: true,
      },
      {
        hash: 'file-3',
        header: <span>styles.css</span>,
        component: <Paper style={{ padding: '16px' }}>Content of styles.css</Paper>,
        closable: true,
      },
    ])
    const [activeKey, setActiveKey] = useState('activeKey', 'file-1')

    return (
      <Tabs
        type="card"
        activeKey={activeKey}
        onTabChange={(key) => setActiveKey(key)}
        tabs={tabs}
        onClose={(key) => {
          const updated = tabs.filter((t) => t.hash !== key)
          setTabs(updated)
          if (activeKey === key && updated.length > 0) {
            setActiveKey(updated[0].hash)
          }
        }}
        onAdd={() => {
          const id = `file-${nextId++}`
          setTabs([
            ...tabs,
            {
              hash: id,
              header: <span>new-file-{id}</span>,
              component: <Paper style={{ padding: '16px' }}>Content of new file {id}</Paper>,
              closable: true,
            },
          ])
          setActiveKey(id)
        }}
      />
    )
  },
})

export const TabsPage = Shade({
  customElementName: 'tabs-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.layers} />}
          title="Tabs"
          description="The Tabs component organizes content into switchable panels with a tab header strip. Tabs support hash-based navigation (deep linking), controlled mode, card-style headers, vertical orientation, closable tabs, and an add button."
        />

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Hash-based (default)
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Tabs
            tabs={[
              {
                header: <span>Tab1</span>,
                component: <Paper>An example tab value for tab 1</Paper>,
                hash: '',
              },
              {
                header: <span>Tab2</span>,
                component: <Paper>An example tab value for tab 2</Paper>,
                hash: 'tab-2',
              },
            ]}
          />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Controlled mode
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <ControlledTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Card type
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <CardTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Vertical orientation
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <VerticalTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Vertical + Card type
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <VerticalCardTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          View transitions
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <ViewTransitionTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Closable tabs with add button
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <ClosableTabsDemo />
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Route-level hash &amp; query (type-safe)
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <TypedRouteDemo />
        </Paper>
      </PageContainer>
    )
  },
})
