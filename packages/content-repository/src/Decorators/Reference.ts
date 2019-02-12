import { Injector } from '@furystack/inject'
import 'reflect-metadata'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { IReferenceType } from '../models'
import { ContentType, ContentTypeDecoratorOptions } from './ContentType'

/**
 * Options type for the Reference decorator
 */
export type ReferenceDecoratorOptions = IReferenceType & { Injector: Injector }

/**
 * returns the default options for the Reference Field
 */
export const getDefaultFieldDecoratorOptions = () =>
  ({
    Injector: Injector.Default,
    AllowMultiple: false,
    AllowedTypeNames: [],
    Type: 'Reference',
  } as ReferenceDecoratorOptions)

/**
 * Decorator method for reference fields
 * @param options Additional options
 */
export const Reference = (options?: Partial<ReferenceDecoratorOptions>) => {
  return (target: any, propertyKey: string) => {
    const defaultOptions = getDefaultFieldDecoratorOptions()
    const mergedOptions: ReferenceDecoratorOptions = {
      ...defaultOptions,
      ...options,
      Type: options && options.AllowMultiple ? 'ReferenceList' : 'Reference',
    }
    const store = mergedOptions.Injector.GetInstance(ContentDescriptorStore)
    let contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor)
    if (!contentTypeDescriptor) {
      ContentType({ Injector: mergedOptions.Injector })(target.constructor)
      contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor) as ContentTypeDecoratorOptions<any>
    }
    if (!contentTypeDescriptor.Fields) {
      contentTypeDescriptor.Fields = {}
    }
    if (contentTypeDescriptor && contentTypeDescriptor.Fields) {
      delete mergedOptions.Injector
      contentTypeDescriptor.Fields[propertyKey] = mergedOptions
    }
    store.ContentTypeDescriptors.set(target.constructor, contentTypeDescriptor)
  }
}
