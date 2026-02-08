import { createComponent, Shade } from '@furystack/shades'
import { InputNumber, PageContainer, PageHeader, Paper, Typography } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'

export const InputNumberPage = Shade({
  tagName: 'input-number-page',
  render: ({ useDisposable, useObservable }) => {
    const controlledValue = useDisposable('controlledValue', () => new ObservableValue<number | undefined>(25))
    const [currentValue] = useObservable('currentValue', controlledValue)

    return (
      <PageContainer maxWidth="1200px" centered>
        <PageHeader
          icon="🔢"
          title="Input Number"
          description="InputNumber provides a numeric input with increment/decrement buttons, keyboard navigation (ArrowUp/Down), min/max clamping, step control, precision formatting, and custom formatter/parser support."
        />

        <Paper elevation={3} style={{ padding: '32px' }}>
          <Typography variant="h3">Basic</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {([undefined, 'outlined', 'contained'] as const).map((variant) => (
              <div style={{ flex: '1', minWidth: '200px' }}>
                <Typography variant="h4">{variant || 'default'}</Typography>
                <InputNumber variant={variant} labelTitle="Quantity" value={1} helperText="Enter a quantity" />
              </div>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Min / Max / Step</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Temperature (°C)"
                value={20}
                min={-40}
                max={50}
                step={0.5}
                precision={1}
                helperText="Range: -40 to 50, step 0.5"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Items (1-99)"
                value={1}
                min={1}
                max={99}
                step={1}
                helperText="Integer values from 1 to 99"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Percentage"
                value={0}
                min={0}
                max={100}
                step={5}
                helperText="0-100 in steps of 5"
              />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Precision</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Integer"
                value={42}
                precision={0}
                helperText="precision={0}"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="One decimal"
                value={3.5}
                step={0.1}
                precision={1}
                helperText="precision={1}, step={0.1}"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Two decimals"
                value={9.99}
                step={0.01}
                precision={2}
                helperText="precision={2}, step={0.01}"
              />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Formatter / Parser</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Currency"
                value={1500}
                step={100}
                min={0}
                formatter={(v: number | undefined) => (v !== undefined ? `$ ${v.toLocaleString('en-US')}` : '')}
                parser={(text: string) => {
                  const cleaned = text.replace(/[^0-9.-]/g, '')
                  const num = Number(cleaned)
                  return isNaN(num) ? undefined : num
                }}
                helperText="Formatted as USD"
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Percentage"
                value={75}
                min={0}
                max={100}
                formatter={(v: number | undefined) => (v !== undefined ? `${v}%` : '')}
                parser={(text: string) => {
                  const cleaned = text.replace('%', '')
                  const num = Number(cleaned)
                  return isNaN(num) ? undefined : num
                }}
                helperText="Formatted with % suffix"
              />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Colors</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {(['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const).map((color) => (
              <div style={{ minWidth: '150px' }}>
                <InputNumber variant="outlined" labelTitle={color} value={50} color={color} />
              </div>
            ))}
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Controlled</Typography>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Controlled value"
                value={currentValue}
                min={0}
                max={100}
                onValueChange={(v: number | undefined) => controlledValue.setValue(v)}
                helperText={`Current value: ${currentValue ?? 'empty'}`}
              />
            </div>
          </div>
        </Paper>

        <Paper elevation={3} style={{ padding: '32px', marginTop: '24px' }}>
          <Typography variant="h3">Disabled & Read-only</Typography>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber variant="outlined" labelTitle="Disabled" value={42} disabled helperText="Cannot interact" />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <InputNumber
                variant="outlined"
                labelTitle="Read-only"
                value={42}
                readOnly
                helperText="Value is read-only"
              />
            </div>
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
