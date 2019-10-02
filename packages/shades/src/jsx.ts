import { DeepPartial, ObservableValue } from '@sensenet/client-utils'
import { ChildrenList } from './models'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    interface Element<TProps = any, TState = any> extends HTMLElement {
      onAttached: ObservableValue<void>
      onDetached: ObservableValue<void>
      state: ObservableValue<TState>
      props: ObservableValue<TProps>
      updateComponent: () => JSX.Element
      onUpdated: ObservableValue<JSX.Element>
      shadeChildren: ObservableValue<ChildrenList>
      callConstruct: () => void
    }

    interface IntrinsicElements {
      div: DeepPartial<HTMLDivElement>
      span: DeepPartial<HTMLSpanElement>
      input: DeepPartial<HTMLInputElement>
      h1: DeepPartial<HTMLHeadingElement>
      h2: DeepPartial<HTMLHeadingElement>
      h3: DeepPartial<HTMLHeadingElement>
      h4: DeepPartial<HTMLHeadingElement>
      h5: DeepPartial<HTMLHeadingElement>
      a: DeepPartial<HTMLAnchorElement>
      p: DeepPartial<HTMLParagraphElement>
      style: DeepPartial<HTMLStyleElement>
      br: DeepPartial<HTMLBRElement>
      textarea: DeepPartial<HTMLTextAreaElement>
      ol: DeepPartial<HTMLOListElement>
      li: DeepPartial<HTMLElement>
      button: DeepPartial<HTMLButtonElement>
      hr: DeepPartial<HTMLHRElement>
    }
  }
}

export const isJsxElement = (obj: any): obj is JSX.Element => {
  const casted = obj as JSX.Element
  return (
    casted.props !== undefined &&
    casted.state !== undefined &&
    casted.onAttached !== undefined &&
    casted.onDetached !== undefined
  )
}
