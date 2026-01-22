import * as readline from 'node:readline'
import {
  runPrerequisiteChecks,
  fetchRemote,
  checkBranchUpToDate,
  execCommand,
  isValidSemver,
  printSuccess,
  printInfo,
  printError,
  parseArgs,
} from './utils.ts'

const promptForVersion = async (defaultVersion?: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    const prompt = defaultVersion
      ? `Enter release version [${defaultVersion}]: `
      : 'Enter release version (e.g., 7.1.0): '

    rl.question(prompt, (answer) => {
      rl.close()
      const version = answer.trim() || defaultVersion || ''
      resolve(version)
    })
  })
}

const startRelease = async (): Promise<void> => {
  const { version: argVersion } = parseArgs()

  // Run prerequisite checks
  if (!runPrerequisiteChecks()) {
    process.exit(1)
  }

  // Fetch latest from remote
  fetchRemote()

  // Check branches are up-to-date
  printInfo('Checking branch status...')

  if (!checkBranchUpToDate('develop')) {
    process.exit(1)
  }

  if (!checkBranchUpToDate('master')) {
    process.exit(1)
  }

  printSuccess('All branches are up-to-date.')
  console.log('')

  // Get version number
  let version = argVersion

  if (!version) {
    version = await promptForVersion()
  }

  if (!version) {
    printError('Version number is required.')
    process.exit(1)
  }

  if (!isValidSemver(version)) {
    printError(`Invalid version format: "${version}". Expected format: X.Y.Z (e.g., 7.1.0)`)
    process.exit(1)
  }

  // Start the release
  printInfo(`Starting release ${version}...`)

  try {
    execCommand(`git flow release start ${version}`)

    console.log('')
    printSuccess(`Release ${version} started successfully!`)
    console.log('')
    console.log('Next steps:')
    console.log('  1. Make any final changes (version bumps, changelog updates)')
    console.log('  2. Commit your changes')
    console.log('  3. Run: yarn release:finish')
  } catch (error) {
    printError('Failed to start release.')
    if (error instanceof Error) {
      console.log(error.message)
    }
    process.exit(1)
  }
}

startRelease().catch((error) => {
  console.error(error)
  process.exit(1)
})
