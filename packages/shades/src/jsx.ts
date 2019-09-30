import { DeepPartial } from '@sensenet/client-utils'

// ToDo: Check eslint error

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    interface Element extends HTMLElement {
      onAttached?: () => void
      onDetached?: () => void
      onStateChanged?: () => void
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
    }
  }
}
