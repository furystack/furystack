import { createComponent, Shade } from '@furystack/shades'
import { Button, Dialog, Icon, icons } from '@furystack/shades-common-components'
import { MarkerSeverity, type editor } from 'monaco-editor'

export const MonacoJsMarkers = Shade<{ markers: editor.IMarker[] }>({
  customElementName: 'monaco-js-markers',

  render: ({ props, useState, useHostProps }) => {
    useHostProps({
      'data-testid': 'js-markers-button',
    })

    if (!props.markers.length) {
      return (
        <>
          <Icon icon={icons.checkCircle} /> No errors
        </>
      )
    }

    const [isOpen, setIsOpen] = useState('isOpened', false)

    const warningCount = props.markers.filter((m) => m.severity === MarkerSeverity.Warning).length
    const errorCount = props.markers.filter((m) => m.severity === MarkerSeverity.Error).length

    return (
      <>
        <Dialog isVisible={isOpen} onClose={() => setIsOpen(false)} title="Warnings and errors list">
          <ul data-testid="js-markers-dialog-list">
            {props.markers.map((marker) => {
              return (
                <li>
                  {marker.severity === MarkerSeverity.Error ? '[ERROR]' : '[WARNING]'} {marker.message} @L
                  {marker.startLineNumber}
                </li>
              )
            })}
          </ul>
        </Dialog>
        <Button
          color={errorCount ? 'error' : 'warning'}
          onclick={() => {
            setIsOpen(true)
          }}
        >
          <Icon icon={icons.warning} />
          {errorCount} errors, {warningCount} warnings
        </Button>
      </>
    )
  },
})
