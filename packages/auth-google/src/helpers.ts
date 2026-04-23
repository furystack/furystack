import type { Injector } from '@furystack/inject'

import { defaultGoogleAuthenticationSettings, GoogleAuthenticationSettings } from './google-authentication-settings.js'
import { GoogleLoginService } from './login-service.js'

/**
 * Configures Google OAuth authentication on the given injector.
 * Must be called **after** `useHttpAuthentication`.
 *
 * Binds {@link GoogleAuthenticationSettings} with the caller-supplied
 * `clientId` merged over the defaults, then invalidates the
 * {@link GoogleLoginService} token so the next resolution picks up the
 * fresh settings.
 *
 * @param injector The Injector instance
 * @param overrides Google settings. `clientId` is required.
 */
export const useGoogleAuthentication = (
  injector: Injector,
  overrides: Partial<GoogleAuthenticationSettings> & Pick<GoogleAuthenticationSettings, 'clientId'>,
): void => {
  if (!overrides.clientId) {
    throw new Error('Google clientId is required.')
  }
  const mergedSettings: GoogleAuthenticationSettings = {
    ...defaultGoogleAuthenticationSettings(),
    ...overrides,
  }
  injector.bind(GoogleAuthenticationSettings, () => mergedSettings)
  injector.invalidate(GoogleAuthenticationSettings)
  injector.invalidate(GoogleLoginService)
}
