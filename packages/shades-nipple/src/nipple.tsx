import { Shade, createComponent } from '@furystack/shades'
import type { EventData, JoystickManagerOptions, JoystickOutputData } from 'nipplejs'
import nipplejs from 'nipplejs'

export interface NippleComponentProps {
  managerOptions: JoystickManagerOptions
  style?: Partial<CSSStyleDeclaration>
  onStart?: (evt: EventData, data: JoystickOutputData) => void
  onEnd?: (evt: EventData, data: JoystickOutputData) => void
  onDir?: (evt: EventData, data: JoystickOutputData) => void
  onMove?: (evt: EventData, data: JoystickOutputData) => void
}

export const NippleComponent = Shade<NippleComponentProps>({
  shadowDomName: 'shade-nipple',
  constructed: async ({ element, props }) => {
    const manager = nipplejs.create({
      zone: element,
      ...props.managerOptions,
    })
    if (props.onStart) {
      manager.on('start', props.onStart)
    }
    if (props.onEnd) {
      manager.on('end', props.onEnd)
    }
    if (props.onDir) {
      manager.on('dir', props.onDir)
    }
    if (props.onMove) {
      manager.on('move', props.onMove)
    }
    return () => manager.destroy()
  },
  render: ({ children }) => {
    if (children) {
      return <>{children}</>
    }
    return <div />
  },
})
