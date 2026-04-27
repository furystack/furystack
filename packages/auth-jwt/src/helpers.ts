import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { HttpAuthenticationSettings } from '@furystack/rest-service'
import { createJwtAuthProvider } from './authentication-providers/jwt-auth-provider.js'
import {
  defaultJwtAuthenticationSettings,
  type FingerprintCookieSettings,
  JwtAuthenticationSettings,
} from './jwt-authentication-settings.js'
import { JwtTokenService } from './jwt-token-service.js'

/**
 * Overrides accepted by {@link useJwtAuthentication}. `secret` is required;
 * every other field is optional and merged with
 * {@link defaultJwtAuthenticationSettings}. `fingerprintCookie` accepts a
 * partial override that is shallow-merged with the defaults, so a caller
 * only needs to specify the fields they want to change.
 */
export type JwtAuthenticationOverrides = Partial<Omit<JwtAuthenticationSettings, 'fingerprintCookie'>> &
  Pick<JwtAuthenticationSettings, 'secret'> & {
    fingerprintCookie?: Partial<FingerprintCookieSettings>
  }

/**
 * Configures JWT Bearer token authentication.
 * Must be called **after** `useHttpAuthentication`.
 *
 * Binds {@link JwtAuthenticationSettings} on the injector (merging `overrides`
 * with the defaults from {@link defaultJwtAuthenticationSettings}), resolves
 * the {@link JwtTokenService} and the current {@link HttpAuthenticationSettings},
 * then appends a JWT bearer authentication provider to the existing chain.
 *
 * **Prerequisite:** bind a persistent implementation of the `RefreshTokenStore`
 * token on the injector before calling this helper — the default factory
 * throws on purpose so refresh tokens are never silently kept in-memory.
 *
 * **Important:** HTTPS is strongly recommended. Bearer tokens transmitted over
 * plain HTTP are vulnerable to interception and replay attacks.
 *
 * @param injector The Injector instance
 * @param overrides JWT settings. `secret` is required and must be at least 32 bytes.
 */
export const useJwtAuthentication = (injector: Injector, overrides: JwtAuthenticationOverrides): void => {
  if (Buffer.byteLength(overrides.secret, 'utf8') < 32) {
    throw new Error('JWT secret must be at least 32 bytes (256 bits) of entropy.')
  }

  const mergedSettings: JwtAuthenticationSettings = {
    ...defaultJwtAuthenticationSettings(),
    ...overrides,
    fingerprintCookie: {
      ...defaultJwtAuthenticationSettings().fingerprintCookie,
      ...overrides.fingerprintCookie,
    },
  }

  injector.bind(JwtAuthenticationSettings, () => mergedSettings)
  injector.invalidate(JwtAuthenticationSettings)
  injector.invalidate(JwtTokenService)

  const httpAuthSettings = injector.get(HttpAuthenticationSettings)
  const jwtTokenService = injector.get(JwtTokenService)
  const systemInjector = useSystemIdentityContext({ injector, username: 'useJwtAuthentication' })
  const userDataSet = systemInjector.get(httpAuthSettings.userDataSet)

  httpAuthSettings.authenticationProviders.push(
    createJwtAuthProvider({
      jwtTokenService,
      userDataSet,
      injector: systemInjector,
      fingerprintCookieName: mergedSettings.fingerprintCookie.enabled ? mergedSettings.fingerprintCookie.name : null,
    }),
  )
}
