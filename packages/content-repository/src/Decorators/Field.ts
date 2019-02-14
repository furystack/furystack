import { Injector } from '@furystack/inject'
import 'reflect-metadata'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { IValueType } from '../models'
import { ContentType, ContentTypeDecoratorOptions } from './ContentType'

/**
 * options for Field decorator
 */
type DecoratorOptins = IValueType & { injector: Injector }

/**
 * Default value of a Field decorator
 */
export const defaultFieldDecoratorOptions: DecoratorOptins = {
  injector: Injector.default,
  type: 'Value',
}

/**
 * Decorator method for ContentType Fields
 * @param options additional options
 */
export const Field = (options?: Partial<DecoratorOptins>) => {
  return (target: any, propertyKey: string) => {
    const mergedOptions = { ...defaultFieldDecoratorOptions, ...options }
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
