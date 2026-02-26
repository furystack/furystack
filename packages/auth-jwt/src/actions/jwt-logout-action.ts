import type { RequestAction } from '@furystack/rest-service'
import { EmptyResult } from '@furystack/rest-service'
import { JwtTokenService } from '../jwt-token-service.js'

/**
 * Action that revokes a refresh token (hard revocation, no grace period).
 */
export const JwtLogoutAction: RequestAction<{
  result: unknown
  body: { refreshToken: string }
}> = async ({ injector, getBody }) => {
  const body = await getBody()
  await injector.getInstance(JwtTokenService).revokeRefreshToken(body.refreshToken)
  return EmptyResult()
}
