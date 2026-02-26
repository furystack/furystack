import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { HttpAuthenticationSettings } from '@furystack/rest-service'
import { createJwtAuthProvider } from './authentication-providers/jwt-auth-provider.js'
import { JwtAuthenticationSettings } from './jwt-authentication-settings.js'
import { JwtTokenService } from './jwt-token-service.js'
import { RefreshToken } from './models/refresh-token.js'

/**
 * Configures JWT Bearer token authentication.
 * Must be called **after** {@link useHttpAuthentication}.
 *
 * @important HTTPS is strongly recommended. Bearer tokens transmitted over
 * plain HTTP are vulnerable to interception and replay attacks.
 *
 * @param injector The Injector instance
 * @param settings JWT settings. `secret` is required and must be at least 32 bytes.
 */
export const useJwtAuthentication = (
  injector: Injector,
  settings: Partial<JwtAuthenticationSettings> & Pick<JwtAuthenticationSettings, 'secret'>,
): void => {
  if (Buffer.byteLength(settings.secret, 'utf8') < 32) {
    throw new Error('JWT secret must be at least 32 bytes (256 bits) of entropy.')
  }

  const jwtSettings = Object.assign(new JwtAuthenticationSettings(), settings)
  injector.setExplicitInstance(jwtSettings, JwtAuthenticationSettings)

  getRepository(injector).createDataSet(RefreshToken, 'token')

  const httpAuthSettings = injector.getInstance(HttpAuthenticationSettings)
  const jwtTokenService = injector.getInstance(JwtTokenService)
  const systemInjector = useSystemIdentityContext({ injector, username: 'useJwtAuthentication' })
  const userDataSet = httpAuthSettings.getUserDataSet(systemInjector)

  httpAuthSettings.authenticationProviders.push(
    createJwtAuthProvider({ jwtTokenService, userDataSet, injector: systemInjector }),
  )
}
