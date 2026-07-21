import fs from 'fs'
import path from 'path'

/**
 * Compares two package.json files and identifies added or updated dependencies.
 * @param localPath - Path to the local package.json file.
 * @param upstreamContent - The content of the upstream package.json file.
 * @returns An object containing added and updated dependencies.
 */
export function getDependencyDiff(localPath: string, upstreamContent: string): {
  added: Record<string, string>
  updated: Record<string, string>
} {
  try {
    const localContent = fs.readFileSync(localPath, 'utf8')
    const localPkg = JSON.parse(localContent)
    const upstreamPkg = JSON.parse(upstreamContent)

    const localDeps = { ...(localPkg.dependencies as Record<string, string>), ...(localPkg.devDependencies as Record<string, string>) }
    const upstreamDeps = { ...(upstreamPkg.dependencies as Record<string, string>), ...(upstreamPkg.devDependencies as Record<string, string>) }

    const added: Record<string, string> = {}
    const updated: Record<string, string> = {}

    for (const [name, version] of Object.entries(localDeps)) {
      if (!upstreamDeps[name]) {
        added[name] = version as string
      } else if (upstreamDeps[name] !== version) {
        updated[name] = version as string
      }
    }

    return { added, updated }
  } catch (error) {
    console.error('Error diffing package.json files:', error)
    return { added: {}, updated: {} }
  }
}
