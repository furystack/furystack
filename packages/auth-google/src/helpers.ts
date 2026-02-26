import type { Injector } from '@furystack/inject'

import { GoogleLoginService } from './login-service.js'

/**
 * Configures Google OAuth authentication.
 * Must be called **after** {@link useHttpAuthentication}.
 *
 * @param injector The Injector instance
 * @param settings Google settings. `clientId` is required.
 */
export const useGoogleAuthentication = (
  injector: Injector,
  settings: Partial<GoogleLoginService> & Pick<GoogleLoginService, 'clientId'>,
): void => {
  if (!settings.clientId) {
    throw new Error('Google clientId is required.')
  }
  const service = Object.assign(new GoogleLoginService(), settings)
  injector.setExplicitInstance(service, GoogleLoginService)
}
