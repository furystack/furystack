import { createComponent, flushUpdates } from '@furystack/shades'
import { describe, expect, it } from 'vitest'
import { Card, CardActions, CardContent, CardHeader, CardMedia } from './card.js'

describe('Card', () => {
  it('should be defined', () => {
    expect(Card).toBeDefined()
    expect(typeof Card).toBe('function')
  })

  it('should create a card element', () => {
    const el = (<Card />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-card')
  })

  it('should render children', async () => {
    const el = (
      <div>
        <Card>
          <span>Content</span>
        </Card>
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.querySelector('span')).not.toBeNull()
  })

  it('should set data-variant to elevation by default', async () => {
    const el = (
      <div>
        <Card />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.getAttribute('data-variant')).toBe('elevation')
  })

  it('should set data-variant to outlined when specified', async () => {
    const el = (
      <div>
        <Card variant="outlined" />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.getAttribute('data-variant')).toBe('outlined')
  })

  it('should set data-elevation to 1 by default', async () => {
    const el = (
      <div>
        <Card />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.getAttribute('data-elevation')).toBe('1')
  })

  it('should set data-elevation to the provided value', async () => {
    const el = (
      <div>
        <Card elevation={3} />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.getAttribute('data-elevation')).toBe('3')
  })

  it('should set data-clickable when clickable is true', async () => {
    const el = (
      <div>
        <Card clickable />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.hasAttribute('data-clickable')).toBe(true)
  })

  it('should set data-clickable when onclick handler is provided', async () => {
    const el = (
      <div>
        <Card onclick={() => {}} />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.hasAttribute('data-clickable')).toBe(true)
  })

  it('should not set data-clickable by default', async () => {
    const el = (
      <div>
        <Card />
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.hasAttribute('data-clickable')).toBe(false)
  })
})

describe('CardHeader', () => {
  it('should be defined', () => {
    expect(CardHeader).toBeDefined()
    expect(typeof CardHeader).toBe('function')
  })

  it('should create a card-header element', () => {
    const el = (<CardHeader title="Title" />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-card-header')
  })

  it('should render a title', async () => {
    const el = (
      <div>
        <CardHeader title="My Title" />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    const titleEl = header.querySelector('.card-header-title')
    expect(titleEl).not.toBeNull()
    expect(titleEl?.textContent).toBe('My Title')
  })

  it('should render a subheader when provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" subheader="Subheader text" />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    const subheaderEl = header.querySelector('.card-header-subheader')
    expect(subheaderEl).not.toBeNull()
    expect(subheaderEl?.textContent).toBe('Subheader text')
  })

  it('should not render a subheader when not provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    const subheaderEl = header.querySelector('.card-header-subheader')
    expect(subheaderEl).toBeNull()
  })

  it('should render an avatar when provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" avatar={<span className="test-avatar">A</span>} />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    const avatarContainer = header.querySelector('.card-header-avatar')
    expect(avatarContainer).not.toBeNull()
    expect(avatarContainer?.querySelector('.test-avatar')).not.toBeNull()
  })

  it('should not render avatar container when not provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    expect(header.querySelector('.card-header-avatar')).toBeNull()
  })

  it('should render an action when provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" action={<button className="test-action">X</button>} />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    const actionContainer = header.querySelector('.card-header-action')
    expect(actionContainer).not.toBeNull()
    expect(actionContainer?.querySelector('.test-action')).not.toBeNull()
  })

  it('should not render action container when not provided', async () => {
    const el = (
      <div>
        <CardHeader title="Title" />
      </div>
    )
    const header = el.firstElementChild as JSX.Element
    header.updateComponent()
    await flushUpdates()
    expect(header.querySelector('.card-header-action')).toBeNull()
  })
})

describe('CardContent', () => {
  it('should be defined', () => {
    expect(CardContent).toBeDefined()
    expect(typeof CardContent).toBe('function')
  })

  it('should create a card-content element', () => {
    const el = (<CardContent />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-card-content')
  })

  it('should render children', async () => {
    const el = (
      <div>
        <CardContent>
          <p>Some text content</p>
        </CardContent>
      </div>
    )
    const content = el.firstElementChild as JSX.Element
    content.updateComponent()
    await flushUpdates()
    expect(content.querySelector('p')).not.toBeNull()
  })
})

describe('CardMedia', () => {
  it('should be defined', () => {
    expect(CardMedia).toBeDefined()
    expect(typeof CardMedia).toBe('function')
  })

  it('should create a card-media element', () => {
    const el = (<CardMedia image="https://example.com/img.jpg" />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-card-media')
  })

  it('should render an img element with the provided src', async () => {
    const el = (
      <div>
        <CardMedia image="https://example.com/photo.jpg" alt="Test photo" />
      </div>
    )
    const media = el.firstElementChild as JSX.Element
    media.updateComponent()
    await flushUpdates()
    const img = media.querySelector('img') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg')
    expect(img.getAttribute('alt')).toBe('Test photo')
  })

  it('should set height on the element', async () => {
    const el = (
      <div>
        <CardMedia image="https://example.com/photo.jpg" height="300px" />
      </div>
    )
    const media = el.firstElementChild as JSX.Element
    media.updateComponent()
    await flushUpdates()
    expect(media.style.height).toBe('300px')
  })

  it('should default height to 200px', async () => {
    const el = (
      <div>
        <CardMedia image="https://example.com/photo.jpg" />
      </div>
    )
    const media = el.firstElementChild as JSX.Element
    media.updateComponent()
    await flushUpdates()
    expect(media.style.height).toBe('200px')
  })

  it('should default alt to empty string', async () => {
    const el = (
      <div>
        <CardMedia image="https://example.com/photo.jpg" />
      </div>
    )
    const media = el.firstElementChild as JSX.Element
    media.updateComponent()
    await flushUpdates()
    const img = media.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('alt')).toBe('')
  })
})

describe('CardActions', () => {
  it('should be defined', () => {
    expect(CardActions).toBeDefined()
    expect(typeof CardActions).toBe('function')
  })

  it('should create a card-actions element', () => {
    const el = (<CardActions />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-card-actions')
  })

  it('should render children', async () => {
    const el = (
      <div>
        <CardActions>
          <button>Action</button>
        </CardActions>
      </div>
    )
    const actions = el.firstElementChild as JSX.Element
    actions.updateComponent()
    await flushUpdates()
    expect(actions.querySelector('button')).not.toBeNull()
  })

  it('should set data-disable-spacing when disableSpacing is true', async () => {
    const el = (
      <div>
        <CardActions disableSpacing />
      </div>
    )
    const actions = el.firstElementChild as JSX.Element
    actions.updateComponent()
    await flushUpdates()
    expect(actions.hasAttribute('data-disable-spacing')).toBe(true)
  })

  it('should not set data-disable-spacing by default', async () => {
    const el = (
      <div>
        <CardActions />
      </div>
    )
    const actions = el.firstElementChild as JSX.Element
    actions.updateComponent()
    await flushUpdates()
    expect(actions.hasAttribute('data-disable-spacing')).toBe(false)
  })
})

describe('Card composition', () => {
  it('should compose Card with all sub-components', async () => {
    const el = (
      <div>
        <Card>
          <CardMedia image="https://example.com/img.jpg" alt="Photo" />
          <CardHeader title="Title" subheader="Subheader" />
          <CardContent>
            <p>Body text</p>
          </CardContent>
          <CardActions>
            <button>Learn More</button>
          </CardActions>
        </Card>
      </div>
    )
    const card = el.firstElementChild as JSX.Element
    card.updateComponent()
    await flushUpdates()
    expect(card.querySelector('shade-card-media')).not.toBeNull()
    expect(card.querySelector('shade-card-header')).not.toBeNull()
    expect(card.querySelector('shade-card-content')).not.toBeNull()
    expect(card.querySelector('shade-card-actions')).not.toBeNull()
  })
})
