import { Constructable, Injector as FInjector } from '@furystack/inject'
import 'reflect-metadata'
import { ContentDescriptorStore } from '../ContentDescriptorStore'
import { ContentType as ContentTypeModel } from '../models'

/**
 * Options for the Content Type decorator
 */
export type ContentTypeDecoratorOptions<T> = ContentTypeModel<T> & { injector: FInjector }

/**
 * Decorator method for ContentType classes
 * @param options additional options
 */
export const ContentType = <T>(options?: Partial<ContentTypeDecoratorOptions<T>>) => {
  return <T2 extends Constructable<any>>(ctor: T2) => {
    const defaultOptions: ContentTypeDecoratorOptions<T> = {
      name: ctor.name,
      injector: FInjector.default,
      jobTypePermissions: [],
      permissions: [],
    }
    const effectiveInjector = (options && options.injector) || defaultOptions.injector
    const store = effectiveInjector.getInstance(ContentDescriptorStore)
    const existingOptions = store.contentTypeDescriptors.get(ctor)
    const mergedOptions = {
      ...defaultOptions,
      ...existingOptions,
      ...options,
    } as ContentTypeDecoratorOptions<T>
    delete mergedOptions.injector

    // tslint:disable-next-line: naming-convention
    const { injector, ...contentType } = Object.assign(new ContentTypeModel(), { ...mergedOptions })
    store.contentTypeDescriptors.set(ctor, contentType as ContentTypeModel)
  }
}
