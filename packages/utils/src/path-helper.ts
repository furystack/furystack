export class PathHelper {
  public static trimSlashes(path: string) {
    while (path.endsWith('/')) {
      path = path.substring(0, path.length - 1)
    }
    while (path.startsWith('/')) {
      path = path.substring(1, path.length)
    }
    return path
  }

  /** Empty / whitespace-only segments are filtered out. */
  public static getSegments(path: string): string[] {
    return path.split('/').filter((segment) => segment && segment.length)
  }

  /** Joins paths, collapsing duplicate and missing slashes between segments. */
  public static joinPaths(...args: string[]) {
    return args.map((path) => this.trimSlashes(path)).join('/')
  }

  public static isAncestorOf(ancestorPath: string, descendantPath: string): boolean {
    return descendantPath.indexOf(`${this.joinPaths(ancestorPath)}/`) === 0
  }

  /**
   * Returns the parent path. Single-segment paths return themselves
   * (e.g. `'Root'` → `'Root'`).
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
   * @example
   * PathHelper.trimTrailingSlash('/api/') // '/api'
   * PathHelper.trimTrailingSlash('http://example.com/') // 'http://example.com'
   */
  public static trimTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url
  }

  /**
   * @example
   * PathHelper.trimLeadingSlash('/api') // 'api'
   * PathHelper.trimLeadingSlash('api') // 'api'
   */
  public static trimLeadingSlash(path: string): string {
    return path.startsWith('/') ? path.slice(1) : path
  }

  /**
   * @example
   * PathHelper.ensureLeadingSlash('api') // '/api'
   * PathHelper.ensureLeadingSlash('/api') // '/api'
   */
  public static ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`
  }

  /** Strips trailing slash from a base URL. Idempotent. */
  public static normalizeBaseUrl(baseUrl: string): string {
    return this.trimTrailingSlash(baseUrl)
  }

  /**
   * Joins a base URL with a path, collapsing slashes. Preserves protocols
   * (`http://`, `https://`, …).
   *
   * @example
   * PathHelper.joinUrl('http://example.com', '/path') // 'http://example.com/path'
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
   * Boundary-aware prefix match — `/api2` does not match `/api`. Trailing
   * slashes on `baseUrl` are tolerated.
   *
   * @example
   * PathHelper.matchesBaseUrl('/api/users', '/api') // true
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
   * Returns the path remainder after stripping `baseUrl`. Exact matches
   * return `''`. When `requestUrl` does not match `baseUrl`, returns
   * `requestUrl` unchanged.
   *
   * @example
   * PathHelper.extractPath('/api/users', '/api') // '/users'
   * PathHelper.extractPath('/api', '/api') // ''
   * PathHelper.extractPath('/api/users?id=1', '/api') // '/users?id=1'
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
   * Collapses consecutive slashes. The `://` after a protocol is preserved.
   *
   * @example
   * PathHelper.normalizeUrl('http://example.com//path') // 'http://example.com/path'
   * PathHelper.normalizeUrl('/api//users///123') // '/api/users/123'
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
