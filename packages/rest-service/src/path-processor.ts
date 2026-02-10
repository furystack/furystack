import { PathHelper } from '@furystack/utils'

/**
 * Handles URL validation, path extraction, and path rewriting for proxy requests
 */
export class PathProcessor {
  /**
   * Validates that a URL string is properly formatted
   * @throws Error if URL is invalid
   */
  public validateUrl(url: string, context = 'URL'): URL {
    try {
      return new URL(url)
    } catch (error) {
      throw new Error(`Invalid ${context}: ${url}${error instanceof Error ? ` (${error.message})` : ''}`, {
        cause: error,
      })
    }
  }

  /**
   * Validates that a URL uses HTTP or HTTPS protocol
   * @throws Error if protocol is not HTTP/HTTPS
   */
  public validateHttpProtocol(url: URL): void {
    if (!url.protocol.startsWith('http')) {
      throw new Error(`Invalid targetBaseUrl protocol: ${url.protocol} (must be http or https)`)
    }
  }

  /**
   * Extracts the path portion after the source base URL
   */
  public extractSourcePath(requestUrl: string, sourceBaseUrl: string): string {
    return PathHelper.extractPath(requestUrl, sourceBaseUrl)
  }

  /**
   * Applies path rewrite function if provided, otherwise returns the path as-is
   */
  public applyPathRewrite(sourcePath: string, pathRewrite?: (path: string) => string): string {
    return pathRewrite ? pathRewrite(sourcePath) : sourcePath
  }

  /**
   * Builds the complete target URL from base URL and processed path
   */
  public buildTargetUrl(targetBaseUrl: string, targetPath: string): string {
    return PathHelper.joinUrl(targetBaseUrl, targetPath)
  }

  /**
   * Processes the full request URL to produce a target URL
   * @throws Error if the resulting target URL is invalid
   */
  public processUrl(
    requestUrl: string,
    sourceBaseUrl: string,
    targetBaseUrl: string,
    pathRewrite?: (path: string) => string,
  ): string {
    const sourcePath = this.extractSourcePath(requestUrl, sourceBaseUrl)
    const targetPath = this.applyPathRewrite(sourcePath, pathRewrite)
    const targetUrl = this.buildTargetUrl(targetBaseUrl, targetPath)

    // Validate the resulting target URL
    this.validateUrl(targetUrl, 'target URL')

    return targetUrl
  }
}
