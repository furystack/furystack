import '@lottiefiles/lottie-player'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    interface IntrinsicElements {
      'lottie-player': {
        autoplay?: boolean
        src: string
        background?: string
        controls?: boolean
        count?: number
        direction?: number
        hover?: boolean
        loop?: boolean
        mode?: string
        renderer?: 'svg' | 'canvas'
        speed?: number
        style?: Partial<CSSStyleDeclaration>
      }
    }
  }
}
