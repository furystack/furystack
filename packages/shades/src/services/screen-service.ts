import { Injectable } from '@furystack/inject'
import { Disposable, ObservableValue } from '@furystack/utils'

export const ScreenSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export type ScreenSize = typeof ScreenSizes[number]

export type Breakpoint = { name: ScreenSize; minSize: number; maxSize?: number }

@Injectable({ lifetime: 'singleton' })
export class Screen implements Disposable {
  private getOrientation = () => (window.matchMedia('(orientation:landscape').matches ? 'landscape' : 'portrait')

  public readonly breakpoints: { [K in ScreenSize]: { minSize: number } } = {
    xl: { minSize: 1920 },
    lg: { minSize: 1280 },
    md: { minSize: 960 },
    sm: { minSize: 600 },
    xs: { minSize: 0 },
  }

  public dispose() {
    window.removeEventListener('resize', this.onResizeListener)
  }

  public readonly screenSize: {
    atLeast: { [K in ScreenSize]: ObservableValue<boolean> }
  } = {
    atLeast: {
      xs: new ObservableValue<boolean>(this.screenSizeAtLeast('xs')),
      sm: new ObservableValue<boolean>(this.screenSizeAtLeast('sm')),
      md: new ObservableValue<boolean>(this.screenSizeAtLeast('md')),
      lg: new ObservableValue<boolean>(this.screenSizeAtLeast('lg')),
      xl: new ObservableValue<boolean>(this.screenSizeAtLeast('xl')),
    },
  }

  private screenSizeAtLeast(size: ScreenSize) {
    return window.innerWidth >= this.breakpoints[size].minSize
  }

  public orientation = new ObservableValue<'landscape' | 'portrait'>(this.getOrientation())

  private onResizeListener = () => {
    this.refreshValues()
  }

  private refreshValues() {
    this.orientation.setValue(this.getOrientation())
    ScreenSizes.forEach((size) => {
      this.screenSize.atLeast[size].setValue(this.screenSizeAtLeast(size))
    })
  }

  constructor() {
    window.addEventListener('resize', this.onResizeListener)
    this.refreshValues()
  }
}
