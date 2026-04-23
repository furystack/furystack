import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { EventHub } from '@furystack/utils'

export interface NotyModel {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  body: any
  timeout?: number
}

export type NotyServiceEvents = { onNotyAdded: NotyModel; onNotyRemoved: NotyModel }

export interface NotyService extends EventHub<NotyServiceEvents> {
  getNotyList(): NotyModel[]
}

export const NotyService: Token<NotyService, 'singleton'> = defineService({
  name: '@furystack/shades-common-components/NotyService',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const hub = new EventHub<NotyServiceEvents>()
    let notyList: NotyModel[] = []

    const onNotyAddListener = (newNoty: NotyModel): void => {
      notyList = [...notyList, newNoty]
    }
    const onNotyRemoveListener = (removedNoty: NotyModel): void => {
      notyList = notyList.filter((noty) => noty !== removedNoty)
    }

    hub.addListener('onNotyAdded', onNotyAddListener)
    hub.addListener('onNotyRemoved', onNotyRemoveListener)

    onDispose(() => {
      notyList = []
      hub.removeListener('onNotyAdded', onNotyAddListener)
      hub.removeListener('onNotyRemoved', onNotyRemoveListener)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      hub[Symbol.dispose]?.()
    })

    const service = Object.assign(hub, {
      getNotyList: () => [...notyList],
    })

    return service as NotyService
  },
})
