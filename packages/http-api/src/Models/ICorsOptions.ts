/**
 * CORS settings
 */
export interface ICorsOptions {
  /**
   * List of allowed origins
   */
  origins: string[]
  /**
   * List of the allowed actions
   */
  methods?: Array<'POST' | 'GET' | 'PUT' | 'DELETE'>
  /**
   * List of the allowed headers
   */
  headers?: string[]
  /**
   * Enable cookies
   */
  credentials?: boolean
}
