import type { IncomingMessage, OutgoingHttpHeaders } from 'http'

// Headers that should not be forwarded to the target server
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

export interface HeaderProcessorOptions {
  headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
  cookies?: (originalCookies: string[]) => string[]
}

export interface ProcessedHeaders {
  proxyHeaders: Record<string, string>
  finalCookies: string[]
}

/**
 * Handles header filtering, transformation, and cookie processing for proxy requests
 */
export class HeaderProcessor {
  /**
   * Filters out hop-by-hop headers that should not be forwarded
   */
  public filterHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
    const filtered: OutgoingHttpHeaders = {}
    for (const [key, value] of Object.entries(headers)) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        filtered[key] = value
      }
    }
    return filtered
  }

  /**
   * Processes cookies from the request
   */
  public processCookies(req: IncomingMessage, cookieTransformer?: (cookies: string[]) => string[]): string[] {
    const originalCookies = req.headers.cookie?.split(';').map((c) => c.trim()) ?? []
    return cookieTransformer ? cookieTransformer(originalCookies) : originalCookies
  }

  /**
   * Builds X-Forwarded-* headers
   */
  public buildForwardedHeaders(req: IncomingMessage, targetHost: string): Record<string, string> {
    const forwardedFor = [
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
      [req.socket.remoteAddress ?? ''],
    ]
      .flat()
      .filter(Boolean)
      .join(', ')

    return {
      Host: targetHost,
      'User-Agent': (req.headers['user-agent'] as string) || 'FuryStack-Proxy/1.0',
      'X-Forwarded-For': forwardedFor,
      'X-Forwarded-Host': (req.headers.host as string) || '',
      'X-Forwarded-Proto':
        (req.headers['x-forwarded-proto'] as string) ||
        ((req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http'),
    }
  }

  /**
   * Converts OutgoingHttpHeaders to a plain string record, excluding cookies and hop-by-hop headers
   */
  public convertHeadersToRecord(headers: OutgoingHttpHeaders): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase()
      if (lowerKey !== 'cookie' && !HOP_BY_HOP_HEADERS.has(lowerKey)) {
        if (typeof value === 'string') {
          result[key] = value
        } else if (typeof value === 'number') {
          result[key] = value.toString()
        } else if (Array.isArray(value)) {
          result[key] = value.join(', ')
        }
        // undefined is intentionally skipped
      }
    }
    return result
  }

  /**
   * Processes all request headers and returns proxy-ready headers
   */
  public processRequestHeaders(
    req: IncomingMessage,
    targetHost: string,
    options: HeaderProcessorOptions = {},
  ): ProcessedHeaders {
    // Extract and normalize original headers
    const originalHeaders: OutgoingHttpHeaders = {}
    for (const [key, value] of Object.entries(req.headers)) {
      originalHeaders[key] = Array.isArray(value) ? value.join(', ') : value
    }

    // Filter and transform headers
    const filteredHeaders = this.filterHeaders(originalHeaders)
    const finalHeaders = options.headers ? options.headers(filteredHeaders) : filteredHeaders

    // Process cookies
    const finalCookies = this.processCookies(req, options.cookies)

    // Build proxy headers
    const headersWithoutCookie = this.convertHeadersToRecord(finalHeaders)
    const forwardedHeaders = this.buildForwardedHeaders(req, targetHost)

    const proxyHeaders: Record<string, string> = {
      ...headersWithoutCookie,
      ...forwardedHeaders,
    }

    if (finalCookies.length > 0) {
      proxyHeaders.Cookie = finalCookies.join('; ')
    }

    return { proxyHeaders, finalCookies }
  }

  /**
   * Filters hop-by-hop headers from response headers
   */
  public isHopByHopHeader(headerName: string): boolean {
    return HOP_BY_HOP_HEADERS.has(headerName.toLowerCase())
  }
}
