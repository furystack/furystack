import { createComponent, Shade } from '@furystack/shades'
import {
  Icon,
  icons,
  PageContainer,
  PageHeader,
  Paper,
  Tabs,
  Typography,
  type Tab,
} from '@furystack/shades-common-components'

const ControlledTabsDemo = Shade({
  shadowDomName: 'controlled-tabs-demo',
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

const ClosableTabsDemo = Shade({
  shadowDomName: 'closable-tabs-demo',
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
  shadowDomName: 'tabs-page',
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
          <Tabs
            type="card"
            activeKey="card-1"
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
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Vertical orientation
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Tabs
            orientation="vertical"
            activeKey="vert-1"
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
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Vertical + Card type
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <Tabs
            orientation="vertical"
            type="card"
            activeKey="vcard-1"
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
        </Paper>

        <Typography variant="h3" style={{ marginTop: '32px', marginBottom: '12px' }}>
          Closable tabs with add button
        </Typography>
        <Paper elevation={3} style={{ padding: '32px' }}>
          <ClosableTabsDemo />
        </Paper>
      </PageContainer>
    )
  },
})
