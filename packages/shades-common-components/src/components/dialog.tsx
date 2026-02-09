import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'
import { Icon } from './icons/icon.js'
import { close } from './icons/icon-definitions.js'
import { Modal } from './modal.js'

export type DialogProps = {
  isVisible: boolean
  title?: string
  onClose?: () => void
  actions?: JSX.Element
  maxWidth?: string
  fullWidth?: boolean
}

const showAnimation = async (el: Element | null) => {
  const panel = el?.querySelector?.('.dialog-panel')
  if (panel) {
    await promisifyAnimation(
      panel,
      [
        { opacity: 0, transform: 'scale(0.9)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )
  }
}

const hideAnimation = async (el: Element | null) => {
  const panel = el?.querySelector?.('.dialog-panel')
  if (panel) {
    await promisifyAnimation(
      panel,
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.9)' },
      ],
      {
        duration: 150,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      },
    )
  }
}

export const Dialog = Shade<DialogProps>({
  shadowDomName: 'shade-dialog',
  css: {
    '& .dialog-panel': {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: cssVariableTheme.background.paper,
      color: cssVariableTheme.text.primary,
      borderRadius: cssVariableTheme.shape.borderRadius.md,
      boxShadow: cssVariableTheme.shadows.xl,
      margin: cssVariableTheme.spacing.lg,
      maxHeight: 'calc(100vh - 64px)',
      overflow: 'hidden',
      fontFamily: cssVariableTheme.typography.fontFamily,
    },

    '& .dialog-header': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `${cssVariableTheme.spacing.md} ${cssVariableTheme.spacing.lg}`,
      borderBottom: `1px solid ${cssVariableTheme.divider}`,
      flexShrink: '0',
    },

    '& .dialog-title': {
      margin: '0',
      fontSize: cssVariableTheme.typography.fontSize.lg,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      lineHeight: cssVariableTheme.typography.lineHeight.tight,
    },

    '& .dialog-close': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      border: 'none',
      background: 'transparent',
      color: cssVariableTheme.text.secondary,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      cursor: 'pointer',
      fontSize: '18px',
      lineHeight: '1',
      padding: '0',
      flexShrink: '0',
      transition: buildTransition(
        ['background', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['color', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
    },

    '& .dialog-close:hover': {
      background: cssVariableTheme.action.hoverBackground,
      color: cssVariableTheme.text.primary,
    },

    '& .dialog-body': {
      padding: cssVariableTheme.spacing.lg,
      overflowY: 'auto',
      flex: '1',
    },

    '& .dialog-actions': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.lg}`,
      borderTop: `1px solid ${cssVariableTheme.divider}`,
      gap: cssVariableTheme.spacing.sm,
      flexShrink: '0',
    },
  },
  render: ({ props, children }) => {
    const { isVisible, title, onClose, actions, maxWidth = '560px', fullWidth } = props

    const handleClose = () => {
      onClose?.()
    }

    return (
      <Modal
        isVisible={isVisible}
        onClose={handleClose}
        showAnimation={showAnimation}
        hideAnimation={hideAnimation}
        backdropStyle={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cssVariableTheme.action.backdrop,
          zIndex: '1300',
        }}
      >
        <div
          className="dialog-panel"
          style={{
            width: fullWidth ? '100%' : undefined,
            maxWidth,
          }}
          onclick={(ev: MouseEvent) => ev.stopPropagation()}
        >
          {title || onClose ? (
            <div className="dialog-header">
              {title ? <h2 className="dialog-title">{title}</h2> : <span />}
              {onClose ? (
                <button className="dialog-close" onclick={handleClose} aria-label="Close dialog">
                  <Icon icon={close} size="small" />
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="dialog-body">{children}</div>
          {actions ? <div className="dialog-actions">{actions}</div> : null}
        </div>
      </Modal>
    )
  },
})

/**
 * Options for the confirm dialog helper
 */
export type ConfirmDialogOptions = {
  title: string
  message: string | JSX.Element
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}

/**
 * Renders a pre-built confirm dialog with confirm/cancel buttons.
 * Returns a JSX element that should be placed in the component tree.
 *
 * @param isVisible - Boolean controlling the dialog visibility
 * @param options - Configuration for the confirm dialog
 * @returns A Dialog JSX element
 *
 * @example
 * ```tsx
 * const [isConfirmOpen, setConfirmOpen] = useState('confirmOpen', false)
 * // ...
 * {ConfirmDialog(isConfirmOpen, {
 *   title: 'Delete Item',
 *   message: 'Are you sure you want to delete this item?',
 *   onConfirm: () => { deleteItem(); setConfirmOpen(false) },
 *   onCancel: () => setConfirmOpen(false),
 * })}
 * ```
 */
export const ConfirmDialog = (isVisible: boolean, options: ConfirmDialogOptions): JSX.Element => {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = options

  const handleCancel = () => {
    onCancel?.()
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog
      isVisible={isVisible}
      title={title}
      onClose={handleCancel}
      maxWidth="440px"
      actions={
        <>
          <button
            className="dialog-cancel-btn"
            onclick={handleCancel}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: 'transparent',
              color: cssVariableTheme.text.secondary,
              cursor: 'pointer',
              fontSize: cssVariableTheme.typography.fontSize.md,
              fontWeight: cssVariableTheme.typography.fontWeight.medium,
            }}
          >
            {cancelText}
          </button>
          <button
            className="dialog-confirm-btn"
            onclick={handleConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: cssVariableTheme.palette.primary.main,
              color: cssVariableTheme.palette.primary.mainContrast,
              cursor: 'pointer',
              fontSize: cssVariableTheme.typography.fontSize.md,
              fontWeight: cssVariableTheme.typography.fontWeight.medium,
            }}
          >
            {confirmText}
          </button>
        </>
      }
    >
      {typeof message === 'string' ? (
        <p
          style={{
            margin: '0',
            fontSize: cssVariableTheme.typography.fontSize.md,
            lineHeight: cssVariableTheme.typography.lineHeight.normal,
            color: cssVariableTheme.text.secondary,
          }}
        >
          {message}
        </p>
      ) : (
        message
      )}
    </Dialog>
  )
}
