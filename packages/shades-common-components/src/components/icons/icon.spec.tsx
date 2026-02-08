import { createComponent, flushUpdates } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import type { IconProps } from './icon.js'
import { Icon } from './icon.js'
import type { IconDefinition } from './icon-types.js'

const sampleStrokeIcon: IconDefinition = {
  paths: [{ d: 'M6 6l12 12M18 6L6 18' }],
}

const sampleFillIcon: IconDefinition = {
  style: 'fill',
  paths: [
    { d: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z' },
    { d: 'M12 8a4 4 0 100 8 4 4 0 000-8z', fillRule: 'evenodd' },
  ],
}

const multiPathIcon: IconDefinition = {
  paths: [{ d: 'M3 12h18' }, { d: 'M3 6h18' }, { d: 'M3 18h18' }],
}

const customViewBoxIcon: IconDefinition = {
  viewBox: '0 0 48 48',
  paths: [{ d: 'M10 10l28 28' }],
}

describe('Icon', () => {
  it('should be defined', () => {
    expect(Icon).toBeDefined()
    expect(typeof Icon).toBe('function')
  })

  it('should create an icon element', () => {
    const el = (<Icon icon={sampleStrokeIcon} />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-icon')
  })

  it('should set props correctly', () => {
    const el = (<Icon icon={sampleStrokeIcon} size="large" color="primary" ariaLabel="Close" />) as unknown as {
      props: IconProps
    }
    expect(el.props.size).toBe('large')
    expect(el.props.color).toBe('primary')
    expect(el.props.ariaLabel).toBe('Close')
  })

  it('should render with default medium size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('data-size')).toBe('medium')
  })

  it('should render with small size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} size="small" />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('data-size')).toBe('small')
  })

  it('should render with large size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} size="large" />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('data-size')).toBe('large')
  })

  it('should handle custom numeric size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} size={20} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.hasAttribute('data-size')).toBe(false)
    expect(icon.style.width).toBe('20px')
    expect(icon.style.height).toBe('20px')
  })

  it('should set role="img" attribute', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('role')).toBe('img')
  })

  it('should set aria-label when ariaLabel is provided', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} ariaLabel="Close button" />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('aria-label')).toBe('Close button')
    expect(icon.hasAttribute('aria-hidden')).toBe(false)
  })

  it('should set aria-hidden when no ariaLabel is provided', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.hasAttribute('aria-label')).toBe(false)
  })

  it('should set palette color CSS custom property', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} color="error" />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.style.getPropertyValue('--icon-color')).toBe('var(--shades-theme-palette-error-main)')
  })

  it('should not set --icon-color when no color prop', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    expect(icon.style.getPropertyValue('--icon-color')).toBe('')
  })

  it('should render an SVG element inside the component', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('should render correct number of path elements for stroke icon', async () => {
    const el = (
      <div>
        <Icon icon={multiPathIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const paths = icon.querySelectorAll('path')
    expect(paths.length).toBe(3)
  })

  it('should render correct number of path elements for fill icon', async () => {
    const el = (
      <div>
        <Icon icon={sampleFillIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const paths = icon.querySelectorAll('path')
    expect(paths.length).toBe(2)
  })

  it('should set stroke attributes for stroke-style icons', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('none')
    expect(svg.getAttribute('stroke')).toBe('currentColor')
    expect(svg.getAttribute('stroke-width')).toBe('2')
    expect(svg.getAttribute('stroke-linecap')).toBe('round')
    expect(svg.getAttribute('stroke-linejoin')).toBe('round')
  })

  it('should set fill attributes for fill-style icons', async () => {
    const el = (
      <div>
        <Icon icon={sampleFillIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('fill')).toBe('currentColor')
    expect(svg.getAttribute('stroke')).toBe('none')
  })

  it('should set fill-rule on paths that specify it', async () => {
    const el = (
      <div>
        <Icon icon={sampleFillIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const paths = icon.querySelectorAll('path')
    expect(paths[1].getAttribute('fill-rule')).toBe('evenodd')
  })

  it('should use default viewBox of 0 0 24 24', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('should use custom viewBox when specified', async () => {
    const el = (
      <div>
        <Icon icon={customViewBoxIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 48 48')
  })

  it('should use custom strokeWidth when specified', async () => {
    const customStrokeIcon: IconDefinition = {
      paths: [{ d: 'M6 6l12 12' }],
      strokeWidth: 3,
    }
    const el = (
      <div>
        <Icon icon={customStrokeIcon} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('stroke-width')).toBe('3')
  })

  it('should set SVG width and height matching size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} size="large" />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('height')).toBe('32')
  })

  it('should set SVG width and height for custom numeric size', async () => {
    const el = (
      <div>
        <Icon icon={sampleStrokeIcon} size={48} />
      </div>
    )
    const icon = el.firstElementChild as JSX.Element
    icon.updateComponent()
    await flushUpdates()
    const svg = icon.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('48')
    expect(svg.getAttribute('height')).toBe('48')
  })
})
