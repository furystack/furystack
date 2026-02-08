import { createComponent } from '@furystack/shades'
import { describe, expect, it, vi } from 'vitest'
import type { ChipProps } from './chip.js'
import { Chip } from './chip.js'

describe('Chip', () => {
  it('should be defined', () => {
    expect(Chip).toBeDefined()
    expect(typeof Chip).toBe('function')
  })

  it('should create a chip element with default props', () => {
    const el = (<Chip />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-chip')
  })

  it('should pass children as chip content', () => {
    const el = (<Chip>Test Label</Chip>) as unknown as JSX.Element
    expect(el).toBeDefined()
  })

  it('should set props correctly', () => {
    const el = (<Chip color="primary" variant="outlined" size="small" disabled />) as unknown as { props: ChipProps }
    expect(el.props.color).toBe('primary')
    expect(el.props.variant).toBe('outlined')
    expect(el.props.size).toBe('small')
    expect(el.props.disabled).toBe(true)
  })

  it('should render with a label span', () => {
    const el = (
      <div>
        <Chip>Default</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.querySelector('.chip-label')).toBeDefined()
  })

  it('should render with a delete button when onDelete is provided', () => {
    const onDelete = vi.fn()
    const el = (
      <div>
        <Chip onDelete={onDelete}>Deletable</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    const deleteBtn = chip.querySelector('.chip-delete') as HTMLElement
    expect(deleteBtn).toBeDefined()
    expect(deleteBtn).not.toBeNull()
  })

  it('should not render a delete button when onDelete is not provided', () => {
    const el = (
      <div>
        <Chip>No Delete</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    const deleteBtn = chip.querySelector('.chip-delete')
    expect(deleteBtn).toBeNull()
  })

  it('should set data-variant attribute when variant is provided', () => {
    const el = (
      <div>
        <Chip variant="outlined">Outlined</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.getAttribute('data-variant')).toBe('outlined')
  })

  it('should set data-size attribute when size is small', () => {
    const el = (
      <div>
        <Chip size="small">Small</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.getAttribute('data-size')).toBe('small')
  })

  it('should set data-disabled attribute when disabled', () => {
    const el = (
      <div>
        <Chip disabled>Disabled</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.hasAttribute('data-disabled')).toBe(true)
  })

  it('should not set data-disabled attribute when not disabled', () => {
    const el = (
      <div>
        <Chip>Enabled</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.hasAttribute('data-disabled')).toBe(false)
  })

  it('should set data-clickable when clickable prop is true', () => {
    const el = (
      <div>
        <Chip clickable>Clickable</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.hasAttribute('data-clickable')).toBe(true)
  })

  it('should set data-clickable when onclick handler is provided', () => {
    const el = (
      <div>
        <Chip onclick={() => {}}>Click Handler</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.hasAttribute('data-clickable')).toBe(true)
  })

  it('should set CSS custom properties for palette color', () => {
    const el = (
      <div>
        <Chip color="primary">Primary</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.style.getPropertyValue('--chip-color-main')).toBe('var(--shades-theme-palette-primary-main)')
  })

  it('should set CSS custom properties for default color when no color prop', () => {
    const el = (
      <div>
        <Chip>Default</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    expect(chip.style.getPropertyValue('--chip-color-main')).toBe('var(--shades-theme-text-secondary)')
  })

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    const el = (
      <div>
        <Chip onDelete={onDelete}>Deletable</Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    const deleteBtn = chip.querySelector('.chip-delete') as HTMLElement
    deleteBtn.click()
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('should stop propagation when delete button is clicked', () => {
    const onDelete = vi.fn()
    const onChipClick = vi.fn()
    const el = (
      <div>
        <Chip onDelete={onDelete} onclick={onChipClick}>
          Deletable
        </Chip>
      </div>
    )
    const chip = el.firstElementChild as JSX.Element
    chip.updateComponent()
    const deleteBtn = chip.querySelector('.chip-delete') as HTMLElement
    deleteBtn.click()
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onChipClick).not.toHaveBeenCalled()
  })
})
