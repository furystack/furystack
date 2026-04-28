/**
 * Thrown when a DataSet authorization callback rejects an operation. REST
 * action handlers translate this to a 403 response.
 */
export class AuthorizationError extends Error {}
