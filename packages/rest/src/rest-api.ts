import { methods } from './methods'
import { RequestAction } from './request-action'

export type RestApi = {
  [M in typeof methods[number]]?: {
    [R: string]: RequestAction<any, any, any> //(...args: any[]) => Promise<{ body: any; status: number; headers: {} }>
  }
}
