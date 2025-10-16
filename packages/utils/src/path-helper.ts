/**
 * Helper class for path-related functions and methods
 *
 * The class contains general helper methods for joining, splitting, modifying and validating paths.
 */
export class PathHelper {
  /**
   * Trims the slash characters from the beginning and from the end of the path to avoid duplicated slashes
   * @param {string} path The source path that should be trimmed
   * @returns the trimmed path
   */
  public static trimSlashes(path: string) {
    while (path.endsWith('/')) {
      path = path.substring(0, path.length - 1)
    }
    while (path.startsWith('/')) {
      path = path.substring(1, path.length)
    }
    return path
  }

  /**
   * Splits a full path into path segments,
   * e.g.: /Root/Example/stuff
   * @param path The path to be splitted
   * @returns {string[]} the segments for the path
   */
  public static getSegments(path: string): string[] {
    return path.split('/').filter((segment) => segment && segment.length)
  }

  /**
   * Method that allows to join paths without multiple or missing slashes
   * @param args The list of the paths to join
   * @returns the joined path string
   */
  public static joinPaths(...args: string[]) {
    return args.map((path) => this.trimSlashes(path)).join('/')
  }

  /**
   * Checks if the ancestorPath is really the ancestor of the descendantPath
   * @param {string} ancestorPath the ancestor path
   * @param {string} descendantPath the descendant path
   * @returns {boolean} if the provided path is the ancestor of the descendant
   */
  public static isAncestorOf(ancestorPath: string, descendantPath: string): boolean {
    return descendantPath.indexOf(`${this.joinPaths(ancestorPath)}/`) === 0
  }

  /**
   * Returns the parent path from a specified path.
   * e.g. "/Root/Example/Content" will return "/Root/Example"
   *
   * "Root" will always return "Root"
   * @param path The content path
   * @returns the parent path
   */
  public static getParentPath(path: string): string {
    const segments = this.getSegments(path)
    if (segments.length > 1) {
      segments.pop()
    }
    return segments.join('/')
  }

  public static normalize(path: string) {
    return this.getSegments(path).join('/')
  }

  /**
   * Trims only the trailing slash from a URL or path
   * @param url The URL or path to trim
   * @returns The URL/path without trailing slash
   * @example
   * PathHelper.trimTrailingSlash('/api/') // '/api'
   * PathHelper.trimTrailingSlash('http://example.com/') // 'http://example.com'
   */
  public static trimTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url
  }

  /**
   * Trims only the leading slash from a path
   * @param path The path to trim
   * @returns The path without leading slash
   * @example
   * PathHelper.trimLeadingSlash('/api') // 'api'
   * PathHelper.trimLeadingSlash('api') // 'api'
   */
  public static trimLeadingSlash(path: string): string {
    return path.startsWith('/') ? path.slice(1) : path
  }

  /**
   * Ensures a path has a leading slash
   * @param path The path to check
   * @returns The path with a leading slash
   * @example
   * PathHelper.ensureLeadingSlash('api') // '/api'
   * PathHelper.ensureLeadingSlash('/api') // '/api'
   */
  public static ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`
  }

  /**
   * Normalizes a base URL by ensuring it has no trailing slash
   * @param baseUrl The base URL to normalize (e.g., 'http://example.com/' or '/api/')
   * @returns The normalized base URL without trailing slash
   * @example
   * PathHelper.normalizeBaseUrl('http://example.com/') // 'http://example.com'
   * PathHelper.normalizeBaseUrl('/api/') // '/api'
   * PathHelper.normalizeBaseUrl('/api') // '/api'
   */
  public static normalizeBaseUrl(baseUrl: string): string {
    return this.trimTrailingSlash(baseUrl)
  }

  /**
   * Joins a base URL with a path, handling slashes correctly
   * Preserves protocols (http://, https://, etc.)
   * @param baseUrl The base URL (with or without trailing slash)
   * @param path The path to append (with or without leading slash)
   * @returns The combined URL with correct slash handling
   * @example
   * PathHelper.joinUrl('http://example.com', '/path') // 'http://example.com/path'
   * PathHelper.joinUrl('http://example.com/', 'path') // 'http://example.com/path'
   * PathHelper.joinUrl('/api', '/users') // '/api/users'
   * PathHelper.joinUrl('/api/', 'users') // '/api/users'
   * PathHelper.joinUrl('http://example.com', '') // 'http://example.com'
   */
  public static joinUrl(baseUrl: string, path: string): string {
    if (!path) {
      return this.normalizeBaseUrl(baseUrl)
    }
    const normalizedBase = this.normalizeBaseUrl(baseUrl)
    const normalizedPath = this.ensureLeadingSlash(path)
    return `${normalizedBase}${normalizedPath}`
  }

  /**
   * Checks if a request URL matches a base URL pattern
   * Handles trailing slash variations correctly
   * @param requestUrl The incoming request URL
   * @param baseUrl The base URL pattern to match against
   * @returns true if the request URL matches the base URL
   * @example
   * PathHelper.matchesBaseUrl('/api/users', '/api') // true
   * PathHelper.matchesBaseUrl('/api', '/api') // true
   * PathHelper.matchesBaseUrl('/api', '/api/') // true
   * PathHelper.matchesBaseUrl('/other', '/api') // false
   * PathHelper.matchesBaseUrl('/api2', '/api') // false (not a path match)
   */
  public static matchesBaseUrl(requestUrl: string, baseUrl: string): boolean {
    const normalizedBase = this.normalizeBaseUrl(baseUrl)
    const normalizedRequest = requestUrl

    // Exact match
    if (normalizedRequest === normalizedBase) {
      return true
    }

    // Check if request starts with base followed by a slash
    // This prevents '/api2' from matching '/api'
    return normalizedRequest.startsWith(`${normalizedBase}/`)
  }

  /**
   * Extracts the remaining path after a base URL
   * Always returns a path with a leading slash (or empty string for exact matches)
   * @param requestUrl The full request URL
   * @param baseUrl The base URL to remove
   * @returns The remaining path with leading slash, or empty string if exact match
   * @example
   * PathHelper.extractPath('/api/users', '/api') // '/users'
   * PathHelper.extractPath('/api', '/api') // ''
   * PathHelper.extractPath('/api/users?id=1', '/api') // '/users?id=1'
   * PathHelper.extractPath('/api/', '/api') // '/'
   */
  public static extractPath(requestUrl: string, baseUrl: string): string {
    const normalizedBase = this.normalizeBaseUrl(baseUrl)

    // Exact match
    if (requestUrl === normalizedBase) {
      return ''
    }

    // If request doesn't match base, return the original request URL
    if (!this.matchesBaseUrl(requestUrl, baseUrl)) {
      return requestUrl
    }

    // Extract the path after the base
    return requestUrl.substring(normalizedBase.length)
  }

  /**
   * Normalizes a URL by removing consecutive slashes (except after protocol)
   * @param url The URL to normalize
   * @returns The normalized URL
   * @example
   * PathHelper.normalizeUrl('http://example.com//path') // 'http://example.com/path'
   * PathHelper.normalizeUrl('/api//users///123') // '/api/users/123'
   * PathHelper.normalizeUrl('http://example.com/') // 'http://example.com/'
   */
  public static normalizeUrl(url: string): string {
    // Handle protocol separately to preserve ://
    const protocolMatch = url.match(/^([a-z][a-z0-9+.-]*:\/\/)(.*)$/i)

    if (protocolMatch) {
      const [, protocol, rest] = protocolMatch
      // Remove consecutive slashes from the rest
      const normalized = rest.replace(/\/+/g, '/')
      return `${protocol}${normalized}`
    }

    // No protocol, just remove consecutive slashes
    return url.replace(/\/+/g, '/')
  }
}
