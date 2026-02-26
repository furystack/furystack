/**
 * Options for the {@link googleLogin} helper.
 */
export type GoogleLoginOptions = {
  /** Backend endpoint URL that accepts the Google ID token (e.g. `/api/auth/google`) */
  endpointUrl: string
  /** The Google ID token from the GIS credential response */
  credential: string
}

/**
 * Sends the Google ID token to the backend login endpoint.
 *
 * Uses `credentials: 'include'` so that session cookies set by the
 * server are stored by the browser.
 *
 * @typeParam TResult The shape of the response body (e.g. `User` for cookies,
 *   `{ accessToken: string; refreshToken: string }` for JWT)
 * @param options The endpoint URL and credential to send
 * @returns The parsed JSON response from the backend
 */
export const googleLogin = async <TResult = unknown>(options: GoogleLoginOptions): Promise<TResult> => {
  const response = await fetch(options.endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token: options.credential }),
  })
  if (!response.ok) {
    throw new Error(`Google login failed: ${response.status}`)
  }
  return response.json() as Promise<TResult>
}
