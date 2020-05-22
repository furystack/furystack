/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/no-namespace */
import { Constructable } from './types/constructable'

declare global {
  namespace Reflect {
    export function decorate<T>(decorators: ClassDecorator[], target: Constructable<T>): Constructable<T>
    export function metadata<T>(key: any, value: any): any
    export function getMetadata(metadataKey: 'design:paramtypes', target: any): any
  }
}

const classDecoratorsMap = new Map<Constructable<any>, any>()

if (typeof Reflect.decorate !== 'function') {
  Reflect.decorate = (decorators, target) => {
    classDecoratorsMap.set(target, decorators)
    const returnTarget = decorators.reduce((prev, current) => {
      if (typeof current === 'function') {
        const updated = current(prev)
        if (updated && typeof updated === typeof prev) {
          return updated
        }
      }
      return prev
    }, target)
    return returnTarget
  }
}

if (typeof Reflect.metadata !== 'function') {
  Reflect.metadata = (key, value) => {
    return { key, value }
  }
}

if (typeof Reflect.getMetadata !== 'function') {
  Reflect.getMetadata = (metadataKey, target) => {
    const value = classDecoratorsMap.get(target)?.find((v: any) => v.key === metadataKey)?.value || []
    return value
  }
}
