import type { Injector } from '@furystack/inject'

import { GoogleLoginSettings } from './login-service.js'

/**
 * Configures Google OAuth authentication.
 * Must be called **after** {@link useHttpAuthentication}.
 *
 * @param injector The Injector instance
 * @param settings Google settings. `clientId` is required.
 */
export const useGoogleAuthentication = (
  injector: Injector,
  settings: Partial<GoogleLoginSettings> & Pick<GoogleLoginSettings, 'clientId'>,
): void => {
  if (!settings.clientId) {
    throw new Error('Google clientId is required.')
  }
  const googleSettings = Object.assign(new GoogleLoginSettings(), settings)
  injector.setExplicitInstance(googleSettings, GoogleLoginSettings)
}
