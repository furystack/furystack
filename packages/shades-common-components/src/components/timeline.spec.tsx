import { createComponent } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import type { TimelineItemProps, TimelineProps } from './timeline.js'
import { Timeline, TimelineItem } from './timeline.js'

describe('TimelineItem', () => {
  it('should be defined', () => {
    expect(TimelineItem).toBeDefined()
    expect(typeof TimelineItem).toBe('function')
  })

  it('should create a timeline item element', () => {
    const el = (<TimelineItem />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-timeline-item')
  })

  it('should pass children as content', () => {
    const el = (<TimelineItem>Event happened</TimelineItem>) as unknown as JSX.Element
    expect(el).toBeDefined()
  })

  it('should set props correctly', () => {
    const el = (<TimelineItem color="success" label="2024-01-01" />) as unknown as { props: TimelineItemProps }
    expect(el.props.color).toBe('success')
    expect(el.props.label).toBe('2024-01-01')
  })

  it('should render dot and content', () => {
    const el = (
      <div>
        <TimelineItem>
          <span>Event content</span>
        </TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    expect(item.querySelector('.timeline-dot')).not.toBeNull()
    expect(item.querySelector('.timeline-content')).not.toBeNull()
    expect(item.querySelector('.timeline-tail')).not.toBeNull()
  })

  it('should render a label when provided', () => {
    const el = (
      <div>
        <TimelineItem label="Jan 2024">Event</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    const label = item.querySelector('.timeline-label') as HTMLElement
    expect(label).not.toBeNull()
    expect(label.textContent).toBe('Jan 2024')
  })

  it('should not render a label when not provided', () => {
    const el = (
      <div>
        <TimelineItem>Event</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    expect(item.querySelector('.timeline-label')).toBeNull()
  })

  it('should set custom dot when dot prop is provided', () => {
    const el = (
      <div>
        <TimelineItem dot={<span>🎉</span>}>Party!</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    const dot = item.querySelector('.timeline-dot') as HTMLElement
    expect(dot.hasAttribute('data-custom')).toBe(true)
  })

  it('should not set data-custom when dot prop is not provided', () => {
    const el = (
      <div>
        <TimelineItem>Event</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    const dot = item.querySelector('.timeline-dot') as HTMLElement
    expect(dot.hasAttribute('data-custom')).toBe(false)
  })

  it('should set CSS custom property for dot color', () => {
    const el = (
      <div>
        <TimelineItem color="success">Done</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    expect(item.style.getPropertyValue('--timeline-dot-color')).toBe('var(--shades-theme-palette-success-main)')
  })

  it('should default to primary color', () => {
    const el = (
      <div>
        <TimelineItem>Event</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    expect(item.style.getPropertyValue('--timeline-dot-color')).toBe('var(--shades-theme-palette-primary-main)')
  })

  it('should render dashed tail when data-pending attribute is set', () => {
    const el = (
      <div>
        <TimelineItem data-pending="">Event</TimelineItem>
      </div>
    )
    const item = el.firstElementChild as JSX.Element
    item.updateComponent()
    const tail = item.querySelector('.timeline-tail') as HTMLElement
    expect(tail.hasAttribute('data-pending')).toBe(true)
  })
})

describe('Timeline', () => {
  it('should be defined', () => {
    expect(Timeline).toBeDefined()
    expect(typeof Timeline).toBe('function')
  })

  it('should create a timeline element', () => {
    const el = (<Timeline />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-timeline')
  })

  it('should set props correctly', () => {
    const el = (<Timeline mode="alternate" pending />) as unknown as { props: TimelineProps }
    expect(el.props.mode).toBe('alternate')
    expect(el.props.pending).toBe(true)
  })

  it('should render timeline items as children', () => {
    const el = (
      <div>
        <Timeline>
          <TimelineItem>First</TimelineItem>
          <TimelineItem>Second</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const items = timeline.querySelectorAll('shade-timeline-item')
    expect(items.length).toBe(2)
  })

  it('should set data-mode attribute', () => {
    const el = (
      <div>
        <Timeline mode="alternate">
          <TimelineItem>Event</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    expect(timeline.getAttribute('data-mode')).toBe('alternate')
  })

  it('should default mode to left', () => {
    const el = (
      <div>
        <Timeline>
          <TimelineItem>Event</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    expect(timeline.getAttribute('data-mode')).toBe('left')
  })

  it('should mark last item with data-last', () => {
    const el = (
      <div>
        <Timeline>
          <TimelineItem>First</TimelineItem>
          <TimelineItem>Last</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const items = timeline.querySelectorAll('shade-timeline-item')
    expect(items[0].hasAttribute('data-last')).toBe(false)
    expect(items[1].hasAttribute('data-last')).toBe(true)
  })

  it('should add pending item when pending is true', () => {
    const el = (
      <div>
        <Timeline pending>
          <TimelineItem>Event</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const items = timeline.querySelectorAll('shade-timeline-item')
    expect(items.length).toBe(2)
  })

  it('should not mark original last item as data-last when pending is present', () => {
    const el = (
      <div>
        <Timeline pending>
          <TimelineItem>First</TimelineItem>
          <TimelineItem>Second</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const items = timeline.querySelectorAll('shade-timeline-item')
    expect(items[0].hasAttribute('data-last')).toBe(false)
    expect(items[1].hasAttribute('data-last')).toBe(false)
  })

  it('should set data-side="right" on items in right mode', () => {
    const el = (
      <div>
        <Timeline mode="right">
          <TimelineItem>Event</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const item = timeline.querySelector('shade-timeline-item') as HTMLElement
    expect(item.getAttribute('data-side')).toBe('right')
  })

  it('should alternate data-side in alternate mode', () => {
    const el = (
      <div>
        <Timeline mode="alternate">
          <TimelineItem>First</TimelineItem>
          <TimelineItem>Second</TimelineItem>
          <TimelineItem>Third</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const items = timeline.querySelectorAll('shade-timeline-item')
    expect(items[0].getAttribute('data-side')).toBe('left')
    expect(items[1].getAttribute('data-side')).toBe('right')
    expect(items[2].getAttribute('data-side')).toBe('left')
  })

  it('should not set data-side in left mode', () => {
    const el = (
      <div>
        <Timeline mode="left">
          <TimelineItem>Event</TimelineItem>
        </Timeline>
      </div>
    )
    const timeline = el.firstElementChild as JSX.Element
    timeline.updateComponent()
    const item = timeline.querySelector('shade-timeline-item') as HTMLElement
    expect(item.hasAttribute('data-side')).toBe(false)
  })
})
