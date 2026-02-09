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
  render: ({ children, props, useDisposable, useRef }) => {
    const zoneRef = useRef<HTMLDivElement>('zone')

    useDisposable('nipple-init', () => {
      let manager: ReturnType<typeof nipplejs.create> | undefined
      queueMicrotask(() => {
        if (!zoneRef.current) return
        manager = nipplejs.create({
          zone: zoneRef.current,
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
      })
      return { [Symbol.dispose]: () => manager?.destroy() }
    })

    if (children) {
      return <div ref={zoneRef}>{children}</div>
    }
    return <div ref={zoneRef} />
  },
})
