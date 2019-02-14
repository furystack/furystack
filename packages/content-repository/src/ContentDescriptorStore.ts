import { Constructable, Injectable } from '@furystack/inject'
import { ContentType } from './models'

/**
 * Store class for content descriptors
 */
@Injectable()
export class ContentDescriptorStore {
  public readonly contentTypeDescriptors: Map<Constructable<any>, ContentType> = new Map()
  public getByName(name: string) {
    const types = Array.from(this.contentTypeDescriptors.entries())
    const found = types.find(t => t[0].name === name)
    if (!found) {
      throw Error(`Content type '${name}' not found`)
    }
    return found[0]
  }
}
