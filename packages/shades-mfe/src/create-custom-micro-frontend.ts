import type { Injector } from '@furystack/inject'
import { CreateMicroFrontendService } from './create-microfrontend-service.js'

/**
 * A callback method that can be used to create the MFE service
 */
export type CreateMfeCallback<TApi> = (options: {
  /**
   * The API implementation instance on the host
   */
  api: TApi
  /**
   * The root element to render the MFE into
   */
  rootElement: HTMLElement
  /**
   * The Injector instance
   */
  injector: Injector
}) => void

export type DestroyMfeCallback<TApi> = (options: {
  /**
   * The API implementation instance on the host
   */
  api: TApi
  /**
   * The Injector instance
   */
  injector: Injector
}) => void

export type CreateCustomMicroFrontendOptions<TApi> = {
  onCreate: CreateMfeCallback<TApi>
  onDestroy?: DestroyMfeCallback<TApi>
}

/**
 * Create a micro frontend
 * @param options - The options for creating the micro frontend
 * @returns The MFE service
 */
export const createCustomMicroFrontend = <TApi>(createOptions: CreateCustomMicroFrontendOptions<TApi>) => {
  return new CreateMicroFrontendService<TApi>(createOptions.onCreate, createOptions.onDestroy)
}
