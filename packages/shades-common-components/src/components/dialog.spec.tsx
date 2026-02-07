import { createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import type { DialogProps } from './dialog.js'
import { ConfirmDialog, Dialog } from './dialog.js'

describe('Dialog', () => {
  it('should be defined', () => {
    expect(Dialog).toBeDefined()
    expect(typeof Dialog).toBe('function')
  })

  it('should create a dialog element', () => {
    const isVisible = new ObservableValue(true)
    const el = (<Dialog isVisible={isVisible} />) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-dialog')
  })

  it('should pass title prop', () => {
    const isVisible = new ObservableValue(true)
    const el = (<Dialog isVisible={isVisible} title="Test Title" />) as unknown as { props: DialogProps }
    expect(el.props.title).toBe('Test Title')
  })

  it('should pass onClose prop', () => {
    const isVisible = new ObservableValue(true)
    const onClose = vi.fn()
    const el = (<Dialog isVisible={isVisible} onClose={onClose} />) as unknown as { props: DialogProps }
    expect(el.props.onClose).toBe(onClose)
  })

  it('should pass actions prop', () => {
    const isVisible = new ObservableValue(true)
    const actions = <button>OK</button>
    const el = (<Dialog isVisible={isVisible} actions={actions} />) as unknown as { props: DialogProps }
    expect(el.props.actions).toBeDefined()
  })

  it('should pass maxWidth prop', () => {
    const isVisible = new ObservableValue(true)
    const el = (<Dialog isVisible={isVisible} maxWidth="800px" />) as unknown as { props: DialogProps }
    expect(el.props.maxWidth).toBe('800px')
  })

  it('should pass fullWidth prop', () => {
    const isVisible = new ObservableValue(true)
    const el = (<Dialog isVisible={isVisible} fullWidth />) as unknown as { props: DialogProps }
    expect(el.props.fullWidth).toBe(true)
  })

  it('should pass children as dialog content', () => {
    const isVisible = new ObservableValue(true)
    const el = (
      <Dialog isVisible={isVisible}>
        <p>Dialog content</p>
      </Dialog>
    ) as unknown as HTMLElement
    expect(el).toBeDefined()
  })

  it('should accept isVisible observable', () => {
    const isVisible = new ObservableValue(false)
    const el = (<Dialog isVisible={isVisible} />) as unknown as { props: DialogProps }
    expect(el.props.isVisible).toBe(isVisible)
  })
})

describe('ConfirmDialog', () => {
  it('should be defined', () => {
    expect(ConfirmDialog).toBeDefined()
    expect(typeof ConfirmDialog).toBe('function')
  })

  it('should create a confirm dialog element', () => {
    const isVisible = new ObservableValue(true)
    const onConfirm = vi.fn()
    const el = ConfirmDialog(isVisible, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as HTMLElement
    expect(el).toBeDefined()
    expect(el.tagName?.toLowerCase()).toBe('shade-dialog')
  })

  it('should pass the title to the dialog', () => {
    const isVisible = new ObservableValue(true)
    const onConfirm = vi.fn()
    const el = ConfirmDialog(isVisible, {
      title: 'Delete Item',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as { props: DialogProps }
    expect(el.props.title).toBe('Delete Item')
  })

  it('should render with default button texts', () => {
    const isVisible = new ObservableValue(true)
    const onConfirm = vi.fn()
    const el = ConfirmDialog(isVisible, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm,
    }) as unknown as { props: DialogProps }
    expect(el.props.actions).toBeDefined()
  })

  it('should accept custom button texts', () => {
    const isVisible = new ObservableValue(true)
    const onConfirm = vi.fn()
    const el = ConfirmDialog(isVisible, {
      title: 'Confirm',
      message: 'Are you sure?',
      confirmText: 'Yes, delete',
      cancelText: 'No, keep',
      onConfirm,
    }) as unknown as HTMLElement
    expect(el).toBeDefined()
  })

  it('should accept JSX as message', () => {
    const isVisible = new ObservableValue(true)
    const onConfirm = vi.fn()
    const el = ConfirmDialog(isVisible, {
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

  it('should set isVisible to false when onCancel is triggered via onClose', () => {
    const isVisible = new ObservableValue(true)
    const onCancel = vi.fn()
    const el = ConfirmDialog(isVisible, {
      title: 'Confirm',
      message: 'Are you sure?',
      onConfirm: vi.fn(),
      onCancel,
    }) as unknown as { props: DialogProps }

    el.props.onClose?.()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(isVisible.getValue()).toBe(false)
  })
})
