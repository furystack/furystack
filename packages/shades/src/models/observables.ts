import { ObservableValue } from '@furystack/utils'

export type Observables = {
  [K: string]: ObservableValue<any>
}

export type CurrentValuesFromObservables<T extends Observables> = {
  [K in keyof T]: T[K] extends ObservableValue<infer V> ? V : never
}
