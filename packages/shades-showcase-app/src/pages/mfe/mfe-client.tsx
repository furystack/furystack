import { createComponent, Shade } from '@furystack/shades'
import { Form, Paper } from '@furystack/shades-common-components'
import { createShadesMicroFrontend } from '@furystack/shades-mfe'

type Api = {
  title: string
  recipients?: string[]
  receivedMessages?: Array<{ from: string; message: string }>
  onMessage?: (message: string, recipient?: string) => void
}

const Component = Shade<Api>({
  shadowDomName: 'mfe-client',
  render: ({ props }) => {
    const { title } = props
    return (
      <Paper elevation={3}>
        <h1>{title}</h1>
        <div
          style={{
            height: '600px',
            overflow: 'auto',
          }}
        >
          {props.receivedMessages?.map((message) => (
            <div>
              <strong>{message.from}:</strong>
              <>{message.message}</>
            </div>
          ))}
        </div>
        <Form
          style={{ gap: '4px' }}
          onSubmit={(formData) => {
            props.onMessage?.(formData.message, formData.recipient)
          }}
          validate={(formData: unknown): formData is { message: string; recipient: string } => {
            return (
              typeof formData === 'object' &&
              typeof (formData as { message: unknown }).message === 'string' &&
              typeof (formData as { recipient: unknown }).recipient === 'string'
            )
          }}
        >
          <select name="recipient">
            <option value="">All</option>
            {props.recipients?.map((recipient) => (
              <option value={recipient}>{recipient}</option>
            ))}
          </select>
          <input type="text" name="message" placeholder="Message" required />
          <button type="submit">Send</button>
        </Form>
      </Paper>
    )
  },
})

export const mfeClient = createShadesMicroFrontend(Component)
