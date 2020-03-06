import { methods } from './methods'

export type Api = {
  [M in typeof methods[number]]?: {
    [R: string]: (...args: any[]) => Promise<{ body: any; status: number; headers: {} }>
  }
}
