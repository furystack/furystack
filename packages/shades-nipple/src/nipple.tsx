import { Shade, createComponent } from '@furystack/shades'
import { create, JoystickManagerOptions, EventData, JoystickOutputData } from 'nipplejs'

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
    const nippleElement = element.children[0] as HTMLDivElement
    if (!nippleElement) {
      return
    }
    const manager = create({
      zone: nippleElement,
    })
    props.onStart && manager.on('start', props.onStart)
    props.onEnd && manager.on('end', props.onEnd)
    props.onDir && manager.on('dir', props.onDir)
    props.onMove && manager.on('move', props.onMove)
    return () => manager.destroy()
  },
  render: ({ children, props, element }) => {
    props.style && Object.assign(element.style, props.style)
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          ...props.style,
        }}>
        {children}
      </div>
    )
  },
})
