import type { PortablePath } from '@yarnpkg/fslib'

/**
 * Version type as defined in Yarn version manifests
 */
export type VersionType = 'patch' | 'minor' | 'major'

/**
 * Parsed release entry from a version manifest
 */
export type ReleaseEntry = {
  /**
   * The name of the package
   */
  packageName: string
  /**
   * The type of version change
   */
  versionType: VersionType
}

/**
 * Parsed version manifest
 */
export type VersionManifest = {
  /**
   * The ID of the manifest
   */
  id: string
  /**
   * The path to the manifest
   */
  path: PortablePath
  /**
   * The releases in the manifest
   */
  releases: ReleaseEntry[]
}

/**
 * Check if a string is a valid version type
 */
function isVersionType(value: string): value is VersionType {
  return value === 'patch' || value === 'minor' || value === 'major'
}

/**
 * Parse a version manifest YAML content
 * @param content - Raw YAML content of the version manifest
 * @param manifestPath - Path to the manifest file (used for ID extraction)
 * @returns Parsed version manifest
 */
export function parseVersionManifest(content: string, manifestPath: PortablePath): VersionManifest {
  const releases: ReleaseEntry[] = []
  const lines = content.split('\n')

  let inReleasesSection = false

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (trimmedLine === 'releases:') {
      inReleasesSection = true
      continue
    }

    if (inReleasesSection && trimmedLine) {
      // Match lines like: '  "@furystack/core": patch'
      const match = trimmedLine.match(/^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)\s*$/)

      if (match) {
        const packageName = match[1]
        const versionType = match[2]

        if (isVersionType(versionType)) {
          releases.push({
            packageName,
            versionType,
          })
        }
      }
    }
  }

  return {
    id: extractManifestId(manifestPath),
    path: manifestPath,
    releases,
  }
}

/**
 * Sanitize a package name for use in filenames
 * @param packageName - The npm package name (e.g., "@furystack/core")
 * @returns Sanitized name suitable for filenames (e.g., "@furystack-core")
 */
export function sanitizePackageName(packageName: string): string {
  return packageName.replace(/\//g, '-')
}

/**
 * Extract the manifest ID from a version manifest path
 * @param manifestPath - Path to the manifest file
 * @returns The manifest ID (e.g., "e94f7891")
 */
export function extractManifestId(manifestPath: PortablePath): string {
  const filename = manifestPath.split('/').pop() ?? ''
  return filename.replace('.yml', '')
}
