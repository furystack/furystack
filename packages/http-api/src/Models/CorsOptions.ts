/**
 * CORS settings
 */
export interface CorsOptions {
  /**
   * List of allowed origins
   */
  origins: string[]
  /**
   * List of the allowed actions
   */
  methods?: Array<'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'>
  /**
   * List of the allowed headers
   */
  headers?: string[]
  /**
   * Enable cookies
   */
  credentials?: boolean
}
