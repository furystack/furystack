import { ObservableValue } from '@furystack/utils'
import { Injectable } from '@furystack/inject'

export interface NotyModel {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  body: any
  timeout?: number
}

@Injectable({ lifetime: 'singleton' })
export class NotyService {
  public onNotyAdded = new ObservableValue<NotyModel>()
  public onNotyRemoved = new ObservableValue<NotyModel>()

  public notys = new ObservableValue<NotyModel[]>([])

  public addNoty = (noty: NotyModel) => {
    this.onNotyAdded.setValue(noty)
    this.notys.setValue([...this.notys.getValue(), noty])
  }

  public removeNoty = (noty: NotyModel) => {
    this.onNotyRemoved.setValue(noty)
    this.notys.setValue(this.notys.getValue().filter((n) => n !== noty))
  }
}
