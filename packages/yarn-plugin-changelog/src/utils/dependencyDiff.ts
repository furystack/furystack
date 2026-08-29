import fs from 'fs'

/**
 * Compares two package.json files and identifies added, updated, and removed dependencies.
 * @param localPath - Path to the local package.json file.
 * @param upstreamContent - The content of the upstream package.json file.
 * @returns An object containing added, updated, and removed dependencies.
 */
export function getDependencyDiff(
  localPath: string,
  upstreamContent: string,
): {
  added: Record<string, string>
  updated: Record<string, string>
  removed: Record<string, string>
} {
  try {
    const localContent = fs.readFileSync(localPath, 'utf8')
    const localPkg = JSON.parse(localContent) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const upstreamPkg = JSON.parse(upstreamContent) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    const localDeps = {
      ...(localPkg.dependencies as Record<string, string>),
      ...(localPkg.devDependencies as Record<string, string>),
    }
    const upstreamDeps = {
      ...(upstreamPkg.dependencies as Record<string, string>),
      ...(upstreamPkg.devDependencies as Record<string, string>),
    }

    const added: Record<string, string> = {}
    const updated: Record<string, string> = {}
    const removed: Record<string, string> = {}

    for (const [name, version] of Object.entries(localDeps)) {
      if (!upstreamDeps[name]) {
        added[name] = version
      } else if (upstreamDeps[name] !== version) {
        updated[name] = version
      }
    }

    for (const [name, version] of Object.entries(upstreamDeps)) {
      if (!localDeps[name]) {
        removed[name] = version
      }
    }

    return { added, updated, removed }
  } catch (error) {
    console.warn('Warning: Failed to parse package.json for diffing:', error)
    return { added: {}, updated: {}, removed: {} }
  }
}
