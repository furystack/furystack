import { createComponent } from '@furystack/shades'
import { flushUpdates } from '@furystack/shades'
import { describe, expect, it, vi } from 'vitest'
import type { AlertProps } from './alert.js'
import { Alert } from './alert.js'

describe('Alert', () => {
  it('should be defined', () => {
    expect(Alert).toBeDefined()
    expect(typeof Alert).toBe('function')
  })

  it('should create an alert element with default props', () => {
    const el = (<Alert>Test message</Alert>) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-alert')
  })

  it('should set severity to info by default', async () => {
    const el = (
      <div>
        <Alert>Info message</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    expect(alert.getAttribute('data-severity')).toBe('info')
  })

  it('should set data-severity attribute for each severity', async () => {
    const severities = ['error', 'warning', 'info', 'success'] as const

    for (const severity of severities) {
      const el = (
        <div>
          <Alert severity={severity}>Message</Alert>
        </div>
      )
      const alert = el.firstElementChild as JSX.Element
      alert.updateComponent()
      await flushUpdates()
      expect(alert.getAttribute('data-severity')).toBe(severity)
    }
  })

  it('should set data-variant attribute when variant is provided', async () => {
    const variants = ['filled', 'outlined', 'standard'] as const

    for (const variant of variants) {
      const el = (
        <div>
          <Alert variant={variant}>Message</Alert>
        </div>
      )
      const alert = el.firstElementChild as JSX.Element
      alert.updateComponent()
      await flushUpdates()
      expect(alert.getAttribute('data-variant')).toBe(variant)
    }
  })

  it('should not set data-variant attribute when variant is not provided', async () => {
    const el = (
      <div>
        <Alert>Message</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    expect(alert.hasAttribute('data-variant')).toBe(false)
  })

  it('should set role="alert" on the element', async () => {
    const el = (
      <div>
        <Alert>Message</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    expect(alert.getAttribute('role')).toBe('alert')
  })

  it('should render a title when title prop is provided', async () => {
    const el = (
      <div>
        <Alert title="Error Title" severity="error">
          Details here
        </Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const titleEl = alert.querySelector('.alert-title')
    expect(titleEl).not.toBeNull()
    expect(titleEl?.textContent).toBe('Error Title')
  })

  it('should not render a title when title prop is not provided', async () => {
    const el = (
      <div>
        <Alert severity="info">Just a message</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const titleEl = alert.querySelector('.alert-title')
    expect(titleEl).toBeNull()
  })

  it('should render a close button when onClose is provided', async () => {
    const onClose = vi.fn()
    const el = (
      <div>
        <Alert onClose={onClose}>Closeable</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const closeBtn = alert.querySelector('.alert-close')
    expect(closeBtn).not.toBeNull()
  })

  it('should not render a close button when onClose is not provided', async () => {
    const el = (
      <div>
        <Alert>Not closeable</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const closeBtn = alert.querySelector('.alert-close')
    expect(closeBtn).toBeNull()
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const el = (
      <div>
        <Alert onClose={onClose}>Closeable</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const closeBtn = alert.querySelector('.alert-close') as HTMLElement
    closeBtn.click()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should stop propagation when close button is clicked', async () => {
    const onClose = vi.fn()
    const onAlertClick = vi.fn()
    const el = (
      <div>
        <Alert onClose={onClose} onclick={onAlertClick}>
          Closeable
        </Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const closeBtn = alert.querySelector('.alert-close') as HTMLElement
    closeBtn.click()
    expect(onClose).toHaveBeenCalledOnce()
    expect(onAlertClick).not.toHaveBeenCalled()
  })

  it('should render the default icon for the severity', async () => {
    const el = (
      <div>
        <Alert severity="error">Error</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const iconEl = alert.querySelector('.alert-icon')
    expect(iconEl).not.toBeNull()
    expect(iconEl?.querySelector('shade-icon')).not.toBeNull()
  })

  it('should render a custom icon when icon prop is provided', async () => {
    const el = (
      <div>
        <Alert severity="error" icon="🔥">
          Error
        </Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const iconEl = alert.querySelector('.alert-icon')
    expect(iconEl).not.toBeNull()
    expect(iconEl?.textContent).toBe('🔥')
  })

  it('should set CSS custom properties for severity color', async () => {
    const el = (
      <div>
        <Alert severity="error">Error</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    expect(alert.style.getPropertyValue('--alert-color-main')).toBe('var(--shades-theme-palette-error-main)')
  })

  it('should set CSS custom properties for success severity', async () => {
    const el = (
      <div>
        <Alert severity="success">Success</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    expect(alert.style.getPropertyValue('--alert-color-main')).toBe('var(--shades-theme-palette-success-main)')
  })

  it('should render children in the message area', async () => {
    const el = (
      <div>
        <Alert>Alert message content</Alert>
      </div>
    )
    const alert = el.firstElementChild as JSX.Element
    alert.updateComponent()
    await flushUpdates()
    const messageEl = alert.querySelector('.alert-message')
    expect(messageEl).not.toBeNull()
  })

  it('should set props correctly', () => {
    const el = (
      <Alert severity="warning" variant="filled" title="Warning Title" icon="⚡">
        Warning content
      </Alert>
    ) as unknown as JSX.Element
    const props = el.props as AlertProps
    expect(props.severity).toBe('warning')
    expect(props.variant).toBe('filled')
    expect(props.title).toBe('Warning Title')
    expect(props.icon).toBe('⚡')
  })
})
