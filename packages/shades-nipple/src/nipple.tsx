import { Shade, createComponent } from '@furystack/shades'
import nipplejs from 'nipplejs'

type NippleManager = ReturnType<typeof nipplejs.create>
export type NippleManagerOptions = Parameters<typeof nipplejs.create>[0]
export type NippleManagerEvent = {
  data: unknown
}
export type NippleManagerEventHandler = (evt: NippleManagerEvent) => void

export type NippleComponentProps = {
  managerOptions: NippleManagerOptions
  style?: Partial<CSSStyleDeclaration>
  onStart?: NippleManagerEventHandler
  onEnd?: NippleManagerEventHandler
  onDir?: NippleManagerEventHandler
  onMove?: NippleManagerEventHandler
}

export const NippleComponent = Shade<NippleComponentProps>({
  customElementName: 'shade-nipple',
  render: ({ children, props, useDisposable, useRef }) => {
    const zoneRef = useRef<HTMLDivElement>('zone')

    useDisposable('nipple-init', () => {
      let manager: NippleManager | undefined
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
