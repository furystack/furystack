import { createComponent } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import type { ResultProps, ResultStatus } from './result.js'
import { Result } from './result.js'

describe('Result', () => {
  it('should be defined', () => {
    expect(Result).toBeDefined()
    expect(typeof Result).toBe('function')
  })

  it('should create a result element', () => {
    const el = (<Result status="success" title="Done" />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-result')
  })

  it('should set data-status attribute for each status', () => {
    const statuses: ResultStatus[] = ['success', 'error', 'warning', 'info', '403', '404', '500']
    expect(statuses.length).toBe(7)

    for (const status of statuses) {
      const el = (
        <div>
          <Result status={status} title="Test" />
        </div>
      )
      const result = el.firstElementChild as JSX.Element
      result.callConstructed()
      expect(result.getAttribute('data-status')).toBe(status)
    }
  })

  it('should render the title text', () => {
    const el = (
      <div>
        <Result status="success" title="Operation Successful" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const titleEl = result.querySelector('.result-title')
    expect(titleEl).not.toBeNull()
    expect(titleEl?.textContent).toBe('Operation Successful')
  })

  it('should render the subtitle when provided', () => {
    const el = (
      <div>
        <Result status="info" title="Info" subtitle="Some details here" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const subtitleEl = result.querySelector('.result-subtitle')
    expect(subtitleEl).not.toBeNull()
    expect(subtitleEl?.textContent).toBe('Some details here')
  })

  it('should not render the subtitle when not provided', () => {
    const el = (
      <div>
        <Result status="success" title="Done" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const subtitleEl = result.querySelector('.result-subtitle')
    expect(subtitleEl).toBeNull()
  })

  it('should render the default icon for each status', () => {
    const statuses: ResultStatus[] = ['success', 'error', 'warning', 'info', '403', '404', '500']
    expect(statuses.length).toBe(7)

    for (const status of statuses) {
      const el = (
        <div>
          <Result status={status} title="Test" />
        </div>
      )
      const result = el.firstElementChild as JSX.Element
      result.callConstructed()
      const iconEl = result.querySelector('.result-icon')
      expect(iconEl).not.toBeNull()
      expect(iconEl?.querySelector('shade-icon')).not.toBeNull()
    }
  })

  it('should render a custom icon when icon prop is provided', () => {
    const el = (
      <div>
        <Result status="success" title="Done" icon="🎉" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const iconEl = result.querySelector('.result-icon')
    expect(iconEl).not.toBeNull()
    expect(iconEl?.textContent).toBe('🎉')
  })

  it('should set CSS custom property for status color', () => {
    const el = (
      <div>
        <Result status="success" title="Done" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    expect(result.style.getPropertyValue('--result-status-color')).toBe('var(--shades-theme-palette-success-main)')
  })

  it('should set CSS custom property for error status color', () => {
    const el = (
      <div>
        <Result status="error" title="Failed" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    expect(result.style.getPropertyValue('--result-status-color')).toBe('var(--shades-theme-palette-error-main)')
  })

  it('should set CSS custom property for 403 status (warning color)', () => {
    const el = (
      <div>
        <Result status="403" title="Forbidden" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    expect(result.style.getPropertyValue('--result-status-color')).toBe('var(--shades-theme-palette-warning-main)')
  })

  it('should set CSS custom property for 404 status (info color)', () => {
    const el = (
      <div>
        <Result status="404" title="Not Found" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    expect(result.style.getPropertyValue('--result-status-color')).toBe('var(--shades-theme-palette-info-main)')
  })

  it('should set CSS custom property for 500 status (error color)', () => {
    const el = (
      <div>
        <Result status="500" title="Server Error" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    expect(result.style.getPropertyValue('--result-status-color')).toBe('var(--shades-theme-palette-error-main)')
  })

  it('should render children in the extra area', () => {
    const el = (
      <div>
        <Result status="success" title="Done">
          <button>Go Home</button>
        </Result>
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const extraEl = result.querySelector('.result-extra')
    expect(extraEl).not.toBeNull()
    const button = extraEl?.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('Go Home')
  })

  it('should not render the extra area when no children are provided', () => {
    const el = (
      <div>
        <Result status="success" title="Done" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const extraEl = result.querySelector('.result-extra')
    expect(extraEl).toBeNull()
  })

  it('should set the icon role to img', () => {
    const el = (
      <div>
        <Result status="success" title="Done" />
      </div>
    )
    const result = el.firstElementChild as JSX.Element
    result.callConstructed()
    const iconEl = result.querySelector('.result-icon')
    expect(iconEl?.getAttribute('role')).toBe('img')
  })

  it('should set props correctly', () => {
    const el = (<Result status="warning" title="Careful" subtitle="Watch out" icon="⚡" />) as unknown as JSX.Element
    const props = el.props as ResultProps
    expect(props.status).toBe('warning')
    expect(props.title).toBe('Careful')
    expect(props.subtitle).toBe('Watch out')
    expect(props.icon).toBe('⚡')
  })
})
