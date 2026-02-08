import { createComponent } from '@furystack/shades'
import { describe, expect, it, vi } from 'vitest'
import type { PaginationProps } from './pagination.js'
import { Pagination } from './pagination.js'

describe('Pagination', () => {
  it('should be defined', () => {
    expect(Pagination).toBeDefined()
    expect(typeof Pagination).toBe('function')
  })

  it('should create a pagination element with required props', () => {
    const onPageChange = vi.fn()
    const el = (<Pagination count={10} page={1} onPageChange={onPageChange} />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-pagination')
  })

  it('should set props correctly', () => {
    const onPageChange = vi.fn()
    const el = (
      <Pagination
        count={10}
        page={3}
        onPageChange={onPageChange}
        siblingCount={2}
        boundaryCount={1}
        disabled
        size="small"
        color="primary"
      />
    ) as unknown as JSX.Element
    const props = el.props as PaginationProps
    expect(props.count).toBe(10)
    expect(props.page).toBe(3)
    expect(props.siblingCount).toBe(2)
    expect(props.boundaryCount).toBe(1)
    expect(props.disabled).toBe(true)
    expect(props.size).toBe('small')
    expect(props.color).toBe('primary')
  })

  it('should render page buttons for small page counts', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    // Should have prev + 5 page buttons + next = 7 buttons
    const items = pagination.querySelectorAll('.pagination-item')
    expect(items.length).toBe(7) // prev + 5 pages + next
  })

  it('should render ellipsis for large page counts', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={20} page={10} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const ellipses = pagination.querySelectorAll('.pagination-ellipsis')
    expect(ellipses.length).toBe(2)
  })

  it('should mark current page as selected', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={3} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const selected = pagination.querySelector('[data-selected]') as HTMLElement
    expect(selected).not.toBeNull()
    expect(selected.textContent).toBe('3')
  })

  it('should set data-disabled on prev button when on first page', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const prevButton = pagination.querySelector('.pagination-item') as HTMLElement
    expect(prevButton.hasAttribute('data-disabled')).toBe(true)
  })

  it('should set data-disabled on next button when on last page', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={5} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const items = pagination.querySelectorAll('.pagination-item')
    const nextButton = items[items.length - 1] as HTMLElement
    expect(nextButton.hasAttribute('data-disabled')).toBe(true)
  })

  it('should call onPageChange with the correct page when a page button is clicked', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    // Click page 3 (index: prev=0, page1=1, page2=2, page3=3)
    const items = pagination.querySelectorAll('.pagination-item')
    ;(items[3] as HTMLElement).click()
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('should call onPageChange with page-1 when prev button is clicked', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={3} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const prevButton = pagination.querySelector('.pagination-item') as HTMLElement
    prevButton.click()
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('should call onPageChange with page+1 when next button is clicked', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={3} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const items = pagination.querySelectorAll('.pagination-item')
    const nextButton = items[items.length - 1] as HTMLElement
    nextButton.click()
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('should not call onPageChange when clicking the currently selected page', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={3} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const selected = pagination.querySelector('[data-selected]') as HTMLElement
    selected.click()
    expect(onPageChange).not.toHaveBeenCalled()
  })

  it('should set data-size attribute when size is provided', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} size="small" />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    expect(pagination.getAttribute('data-size')).toBe('small')
  })

  it('should set data-disabled on host when disabled', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} disabled />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    expect(pagination.hasAttribute('data-disabled')).toBe(true)
  })

  it('should set CSS custom properties for palette color', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} color="primary" />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    expect(pagination.style.getPropertyValue('--pagination-color-main')).toBe(
      'var(--shades-theme-palette-primary-main)',
    )
  })

  it('should set default CSS custom properties when no color prop', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={5} page={1} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    expect(pagination.style.getPropertyValue('--pagination-color-main')).toBe('var(--shades-theme-text-primary)')
  })

  it('should render only left ellipsis when near the end', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={20} page={19} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const ellipses = pagination.querySelectorAll('.pagination-ellipsis')
    expect(ellipses.length).toBe(1)
  })

  it('should render only right ellipsis when near the start', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={20} page={2} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const ellipses = pagination.querySelectorAll('.pagination-ellipsis')
    expect(ellipses.length).toBe(1)
  })

  it('should render all pages without ellipsis for count equal to total display slots', () => {
    const onPageChange = vi.fn()
    const el = (
      <div>
        <Pagination count={7} page={4} onPageChange={onPageChange} />
      </div>
    )
    const pagination = el.firstElementChild as JSX.Element
    pagination.updateComponent()
    const ellipses = pagination.querySelectorAll('.pagination-ellipsis')
    expect(ellipses.length).toBe(0)
    const items = pagination.querySelectorAll('.pagination-item')
    expect(items.length).toBe(9) // prev + 7 pages + next
  })
})
