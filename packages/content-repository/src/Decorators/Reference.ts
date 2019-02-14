import { Injector } from '@furystack/inject'
import 'reflect-metadata'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { IReferenceType } from '../models'
import { ContentType, ContentTypeDecoratorOptions } from './ContentType'

/**
 * Options type for the Reference decorator
 */
export type ReferenceDecoratorOptions = IReferenceType & { injector: Injector }

/**
 * returns the default options for the Reference Field
 */
export const getDefaultFieldDecoratorOptions = () =>
  ({
    injector: Injector.default,
    allowMultiple: false,
    allowedTypeNames: [],
    type: 'Reference',
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
      type: options && options.allowMultiple ? 'ReferenceList' : 'Reference',
    }
    const store = mergedOptions.injector.getInstance(ContentDescriptorStore)
    let contentTypeDescriptor = store.contentTypeDescriptors.get(target.constructor)
    if (!contentTypeDescriptor) {
      ContentType({ injector: mergedOptions.injector })(target.constructor)
      contentTypeDescriptor = store.contentTypeDescriptors.get(target.constructor) as ContentTypeDecoratorOptions<any>
    }
    if (!contentTypeDescriptor.fields) {
      contentTypeDescriptor.fields = {}
    }
    if (contentTypeDescriptor && contentTypeDescriptor.fields) {
      delete mergedOptions.injector
      contentTypeDescriptor.fields[propertyKey] = mergedOptions
    }
    store.contentTypeDescriptors.set(target.constructor, contentTypeDescriptor)
  }
}
