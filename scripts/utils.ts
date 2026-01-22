import { execSync, type ExecSyncOptions } from 'node:child_process'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
} as const

export const printError = (message: string): void => {
  console.error(`${colors.red}Error: ${message}${colors.reset}`)
}

export const printSuccess = (message: string): void => {
  console.log(`${colors.green}${message}${colors.reset}`)
}

export const printInfo = (message: string): void => {
  console.log(`${colors.blue}${message}${colors.reset}`)
}

export const printWarning = (message: string): void => {
  console.log(`${colors.yellow}Warning: ${message}${colors.reset}`)
}

export const printGray = (message: string): void => {
  console.log(`${colors.gray}${message}${colors.reset}`)
}

type ExecCommandOptions = {
  silent?: boolean
  cwd?: string
}

/**
 * Execute a shell command and return the output
 * @param command - The command to execute
 * @param options - Execution options
 * @returns The stdout output trimmed
 * @throws Error if the command fails
 */
export const execCommand = (command: string, options: ExecCommandOptions = {}): string => {
  const execOptions: ExecSyncOptions = {
    encoding: 'utf-8',
    stdio: options.silent ? 'pipe' : 'inherit',
    cwd: options.cwd,
  }

  try {
    const result = execSync(command, execOptions)
    return typeof result === 'string' ? result.trim() : ''
  } catch (error) {
    if (error instanceof Error && 'stdout' in error) {
      const { stdout } = error as { stdout?: Buffer | string }
      return typeof stdout === 'string' ? stdout.trim() : (stdout?.toString().trim() ?? '')
    }
    throw error
  }
}

/**
 * Execute a command silently and return the output
 */
export const execSilent = (command: string): string => {
  return execCommand(command, { silent: true })
}

/**
 * Check if a command exists in PATH
 */
export const commandExists = (command: string): boolean => {
  try {
    execSync(`which ${command}`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Check if git is installed and available
 */
export const checkGitInstalled = (): boolean => {
  if (!commandExists('git')) {
    printError('Git is not installed or not in PATH.')
    console.log('Please install Git: https://git-scm.com/downloads')
    return false
  }
  return true
}

/**
 * Check if git-flow CLI is installed
 */
export const checkGitFlowInstalled = (): boolean => {
  try {
    execSilent('git flow version')
    return true
  } catch {
    printError('Git Flow is not installed.')
    console.log('Please install Git Flow:')
    console.log('  - macOS: brew install git-flow-avh')
    console.log('  - Ubuntu/Debian: apt-get install git-flow')
    console.log('  - Windows: Git for Windows includes it, or use: choco install gitflow-avh')
    return false
  }
}

/**
 * Check if git-flow is configured in the current repository
 */
export const isGitFlowConfigured = (): boolean => {
  try {
    const result = execSilent('git config --get gitflow.branch.master')
    return result.length > 0
  } catch {
    return false
  }
}

/**
 * Run all prerequisite checks for git-flow operations
 * @returns true if all checks pass, false otherwise
 */
export const runPrerequisiteChecks = (): boolean => {
  if (!checkGitInstalled()) {
    return false
  }

  if (!checkGitFlowInstalled()) {
    return false
  }

  if (!isGitFlowConfigured()) {
    printError('Git Flow is not initialized in this repository.')
    console.log('Run: yarn gitflow:init')
    return false
  }

  return true
}

/**
 * Fetch latest changes from remote
 */
export const fetchRemote = (remote = 'origin'): void => {
  printInfo(`Fetching latest from ${remote}...`)
  execCommand(`git fetch ${remote}`, { silent: true })
}

type BranchStatus = {
  isUpToDate: boolean
  ahead: number
  behind: number
}

/**
 * Check if a local branch is in sync with its remote counterpart
 */
export const getBranchStatus = (branch: string, remote = 'origin'): BranchStatus => {
  try {
    const localRef = execSilent(`git rev-parse ${branch}`)
    const remoteRef = execSilent(`git rev-parse ${remote}/${branch}`)

    if (localRef === remoteRef) {
      return { isUpToDate: true, ahead: 0, behind: 0 }
    }

    const ahead = parseInt(execSilent(`git rev-list --count ${remote}/${branch}..${branch}`), 10)
    const behind = parseInt(execSilent(`git rev-list --count ${branch}..${remote}/${branch}`), 10)

    return { isUpToDate: false, ahead, behind }
  } catch {
    return { isUpToDate: false, ahead: 0, behind: 0 }
  }
}

/**
 * Check if a branch is up-to-date with remote and print appropriate messages
 * @returns true if up-to-date, false otherwise
 */
export const checkBranchUpToDate = (branch: string, remote = 'origin'): boolean => {
  const status = getBranchStatus(branch, remote)

  if (status.isUpToDate) {
    return true
  }

  if (status.behind > 0) {
    printError(`Branch '${branch}' is behind '${remote}/${branch}' by ${status.behind} commit(s).`)
    console.log(`Please pull the latest changes: git checkout ${branch} && git pull`)
    return false
  }

  if (status.ahead > 0) {
    printWarning(`Branch '${branch}' is ahead of '${remote}/${branch}' by ${status.ahead} commit(s).`)
    return true
  }

  return true
}

/**
 * Get the current git branch name
 */
export const getCurrentBranch = (): string => {
  return execSilent('git rev-parse --abbrev-ref HEAD')
}

/**
 * Check if currently on a release branch
 */
export const isOnReleaseBranch = (): boolean => {
  const branch = getCurrentBranch()
  return branch.startsWith('release/')
}

/**
 * Get the release version from the current release branch
 */
export const getReleaseVersion = (): string | null => {
  const branch = getCurrentBranch()
  if (!branch.startsWith('release/')) {
    return null
  }
  return branch.replace('release/', '')
}

/**
 * Validate semver format (X.Y.Z)
 */
export const isValidSemver = (version: string): boolean => {
  return /^\d+\.\d+\.\d+$/.test(version)
}

/**
 * Parse command line arguments
 */
export const parseArgs = (): { silent: boolean; version?: string } => {
  const args = process.argv.slice(2)
  return {
    silent: args.includes('--silent'),
    version: args.find((arg) => !arg.startsWith('--')),
  }
}
