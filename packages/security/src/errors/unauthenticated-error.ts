/**
 * Thrown when credential verification fails: bad username/password, expired
 * password, or expired/invalid reset token. REST handlers should map this
 * to a 401 response.
 */
export class UnauthenticatedError extends Error {}
