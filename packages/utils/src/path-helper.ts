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
    return args.map(this.trimSlashes).join('/')
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
}
