import { Injectable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'

export interface NotyModel {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  body: any
  timeout?: number
}

@Injectable({ lifetime: 'singleton' })
export class NotyService extends EventHub<{ onNotyAdded: NotyModel; onNotyRemoved: NotyModel }> {
  private notyList: NotyModel[] = []

  public getNotyList = () => [...this.notyList]

  private onNotyAddListener(newNoty: NotyModel) {
    this.notyList = [...this.notyList, newNoty]
  }

  private onNotyRemoveListener(removedNoty: NotyModel) {
    this.notyList = this.notyList.filter((noty) => noty !== removedNoty)
  }

  public [Symbol.dispose](): void {
    this.notyList = []
    this.removeListener('onNotyAdded', this.onNotyAddListener.bind(this))
    this.removeListener('onNotyRemoved', this.onNotyRemoveListener.bind(this))
    super[Symbol.dispose]?.()
  }

  constructor() {
    super()
    this.addListener('onNotyAdded', this.onNotyAddListener.bind(this))
    this.addListener('onNotyRemoved', this.onNotyRemoveListener.bind(this))
  }
}
