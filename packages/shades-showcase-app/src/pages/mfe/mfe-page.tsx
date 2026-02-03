import { createComponent, Shade } from '@furystack/shades'
import { Button, Form, Input, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'
import { MicroFrontend } from '@furystack/shades-mfe'

const importerService = async () => {
  const { mfeClient } = await import('./mfe-client.js')
  return mfeClient
}

type MfeClientState = {
  name: string
  messages: Array<{ from: string; message: string }>
}

export const MFEPage = Shade({
  shadowDomName: 'shades-mfe-page',
  render: ({ useState }) => {
    const [mfeClients, setMfeClients] = useState<MfeClientState[]>('mfeClients', [])

    return (
      <PageContainer maxWidth="1000px" centered>
        <PageHeader
          icon="🧩"
          title="Micro Frontends"
          description="The MicroFrontend component from @furystack/shades-mfe enables loading and composing independent frontend applications. Each micro frontend is loaded lazily via a loader callback and receives an API object for communication with the host. This demo shows multiple micro frontends exchanging messages, demonstrating inter-app communication patterns for distributed frontend architectures."
        />
        <Paper elevation={3}>
          <Paper>
            <p>Add Client</p>
            <Form
              onSubmit={(formData) => {
                setMfeClients([
                  ...mfeClients,
                  {
                    name: formData.mfeName,
                    messages: [],
                  },
                ])
              }}
              validate={(formData: unknown): formData is { mfeName: string } => {
                return typeof formData === 'object' && typeof (formData as { mfeName: unknown }).mfeName === 'string'
              }}
            >
              <Input placeholder="MFE Name" name="mfeName" required autofocus />
              <Button type="submit">Add MFE</Button>
            </Form>
          </Paper>
          <div style={{ display: 'flex' }}>
            {mfeClients.map((mfeClient) => (
              <MicroFrontend
                api={{
                  title: mfeClient.name,
                  onMessage: (message, recipient) => {
                    setMfeClients(
                      mfeClients.map((client) => {
                        if (!recipient || client.name === recipient) {
                          return {
                            ...client,
                            messages: [...client.messages, { from: mfeClient.name, message }],
                          }
                        }
                        return client
                      }),
                    )
                  },
                  receivedMessages: mfeClient.messages,
                  recipients: mfeClients.map((client) => client.name).filter((name) => name !== mfeClient.name),
                }}
                loaderCallback={importerService}
                loader={<Paper>Loading...</Paper>}
                error={(error, retry) => (
                  <Paper>
                    <h1>Error</h1>
                    <p>{error}</p>
                    <Button onclick={retry}>Retry</Button>
                  </Paper>
                )}
              />
            ))}
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
