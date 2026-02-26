import { RequestError } from '@furystack/rest'
import type { RequestAction } from '@furystack/rest-service'
import { JsonResult } from '@furystack/rest-service'
import { HttpUserContext } from '@furystack/rest-service'
import { UnauthenticatedError } from '@furystack/security'
import { JwtTokenService } from '../jwt-token-service.js'

/**
 * Action that exchanges a valid refresh token for a new access + refresh token pair.
 * Uses token rotation with a configurable grace period.
 */
export const JwtRefreshAction: RequestAction<{
  result: { accessToken: string; refreshToken: string }
  body: { refreshToken: string }
}> = async ({ injector, getBody }) => {
  const body = await getBody()
  const tokenService = injector.getInstance(JwtTokenService)
  try {
    const { username, replacedByToken } = await tokenService.verifyRefreshToken(body.refreshToken)

    const userContext = injector.getInstance(HttpUserContext)
    const userDataSet = userContext.getUserDataSet()
    const users = await userDataSet.find(injector, { filter: { username: { $eq: username } }, top: 2 })
    if (users.length !== 1) {
      throw new UnauthenticatedError()
    }
    const user = users[0]

    if (replacedByToken) {
      const accessToken = tokenService.signAccessToken(user)
      return JsonResult({ accessToken, refreshToken: replacedByToken }, 200)
    }

    const newAccessToken = tokenService.signAccessToken(user)
    const newRefreshToken = await tokenService.signRefreshToken(user)
    await tokenService.rotateRefreshToken(body.refreshToken, newRefreshToken)
    return JsonResult({ accessToken: newAccessToken, refreshToken: newRefreshToken }, 200)
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      throw new RequestError('Token refresh failed', 401)
    }
    throw error
  }
}
