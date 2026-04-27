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
 * POSTs `{ token: credential }` to `endpointUrl` with `credentials:
 * 'include'` (so the server's session cookie sticks). Result type is
 * inferred from the call site — `User` for cookie auth,
 * `{ accessToken, refreshToken }` for JWT, etc.
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
