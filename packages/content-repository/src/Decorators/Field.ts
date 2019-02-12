import { Injector } from '@furystack/inject'
import 'reflect-metadata'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { IValueType } from '../models'
import { ContentType, ContentTypeDecoratorOptions } from './ContentType'

/**
 * options for Field decorator
 */
type DecoratorOptins = IValueType & { Injector: Injector }

/**
 * Default value of a Field decorator
 */
export const defaultFieldDecoratorOptions: DecoratorOptins = {
  Injector: Injector.Default,
  Type: 'Value',
}

/**
 * Decorator method for ContentType Fields
 * @param options additional options
 */
export const Field = (options?: Partial<DecoratorOptins>) => {
  return (target: any, propertyKey: string) => {
    const mergedOptions = { ...defaultFieldDecoratorOptions, ...options }
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
