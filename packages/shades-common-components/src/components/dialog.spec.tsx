import { createComponent } from '@furystack/shades'
import { describe, expect, it, vi } from 'vitest'
import type { DialogProps } from './dialog.js'
import { ConfirmDialog, Dialog } from './dialog.js'

describe('Dialog', () => {
  it('should be defined', () => {
    expect(Dialog).toBeDefined()
    expect(typeof Dialog).toBe('function')
  })

  it('should create a dialog element', () => {
    const el = (<Dialog isVisible={true} />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-dialog')
  })

  it('should pass title prop', () => {
    const el = (<Dialog isVisible={true} title="Test Title" />) as unknown as { props: DialogProps }
    expect(el.props.title).toBe('Test Title')
  })

  it('should pass onClose prop', () => {
    const onClose = vi.fn()
    const el = (<Dialog isVisible={true} onClose={onClose} />) as unknown as { props: DialogProps }
    expect(el.props.onClose).toBe(onClose)
  })

  it('should pass actions prop', () => {
    const actions = <button>OK</button>
    const el = (<Dialog isVisible={true} actions={actions} />) as unknown as { props: DialogProps }
    expect(el.props.actions).toBeDefined()
  })

  it('should pass maxWidth prop', () => {
    const el = (<Dialog isVisible={true} maxWidth="800px" />) as unknown as { props: DialogProps }
    expect(el.props.maxWidth).toBe('800px')
  })

  it('should pass fullWidth prop', () => {
    const el = (<Dialog isVisible={true} fullWidth />) as unknown as { props: DialogProps }
    expect(el.props.fullWidth).toBe(true)
  })

  it('should pass children as dialog content', () => {
    const el = (
      <Dialog isVisible={true}>
        <p>Dialog content</p>
      </Dialog>
    ) as unknown as HTMLElement
    expect(el).toBeDefined()
  })

  it('should accept isVisible boolean', () => {
    const el = (<Dialog isVisible={false} />) as unknown as { props: DialogProps }
    expect(el.props.isVisible).toBe(false)
  })
})

describe('ConfirmDialog', () => {
  it('should be defined', () => {
    expect(ConfirmDialog).toBeDefined()
    expect(typeof ConfirmDialog).toBe('function')
  })

  it('should create a confirm dialog element', () => {
    const onConfirm = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-dialog')
  })

  it('should pass the title to the dialog', () => {
    const onConfirm = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Delete Item',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as { props: DialogProps }
    expect(el.props.title).toBe('Delete Item')
  })

  it('should render with default button texts', () => {
    const onConfirm = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as { props: DialogProps }
    expect(el.props.actions).toBeDefined()
  })

  it('should accept custom button texts', () => {
    const onConfirm = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Confirm',
      message: 'Are you sure?',
      confirmText: 'Yes, delete',
      cancelText: 'No, keep',
      onConfirm,
    }) as unknown as HTMLElement
    expect(el).toBeDefined()
  })

  it('should accept JSX as message', () => {
    const onConfirm = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Confirm',
      message: (
        <div>
          <strong>Warning:</strong> This action cannot be undone.
        </div>
      ),
      onConfirm,
    }) as unknown as HTMLElement
    expect(el).toBeDefined()
  })

  it('should call onCancel when onClose is triggered', () => {
    const onCancel = vi.fn()
    const el = ConfirmDialog(true, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm: vi.fn(),
      onCancel,
    }) as unknown as { props: DialogProps }

    el.props.onClose?.()
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
