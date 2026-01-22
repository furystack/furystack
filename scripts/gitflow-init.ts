import {
  checkGitInstalled,
  checkGitFlowInstalled,
  isGitFlowConfigured,
  execCommand,
  printSuccess,
  printInfo,
  printWarning,
  parseArgs,
} from './utils.ts'

const GITFLOW_CONFIG = {
  master: 'master',
  develop: 'develop',
  feature: 'feature/',
  bugfix: 'fix/',
  release: 'release/',
  hotfix: 'hotfix/',
  support: 'support/',
  versiontag: '',
} as const

const initGitFlow = (): void => {
  const { silent } = parseArgs()

  // Check if git is installed
  if (!checkGitInstalled()) {
    process.exit(1)
  }

  // Check if git-flow is installed
  if (!checkGitFlowInstalled()) {
    if (silent) {
      // In silent mode (postinstall), just warn and exit successfully
      process.exit(0)
    }
    process.exit(1)
  }

  // Check if already configured
  if (isGitFlowConfigured()) {
    if (!silent) {
      printInfo('Git Flow is already configured in this repository.')
    }
    process.exit(0)
  }

  // Initialize git-flow with project conventions
  printInfo('Initializing Git Flow with project conventions...')

  try {
    // Use git flow init with defaults and force flag to avoid interactive prompts
    // We set the config values directly instead of using interactive init
    execCommand(`git config gitflow.branch.master ${GITFLOW_CONFIG.master}`, { silent: true })
    execCommand(`git config gitflow.branch.develop ${GITFLOW_CONFIG.develop}`, { silent: true })
    execCommand(`git config gitflow.prefix.feature ${GITFLOW_CONFIG.feature}`, { silent: true })
    execCommand(`git config gitflow.prefix.bugfix ${GITFLOW_CONFIG.bugfix}`, { silent: true })
    execCommand(`git config gitflow.prefix.release ${GITFLOW_CONFIG.release}`, { silent: true })
    execCommand(`git config gitflow.prefix.hotfix ${GITFLOW_CONFIG.hotfix}`, { silent: true })
    execCommand(`git config gitflow.prefix.support ${GITFLOW_CONFIG.support}`, { silent: true })
    execCommand(`git config gitflow.prefix.versiontag "${GITFLOW_CONFIG.versiontag}"`, { silent: true })

    printSuccess('Git Flow initialized successfully!')
    console.log('')
    console.log('Configuration:')
    console.log(`  Master branch:    ${GITFLOW_CONFIG.master}`)
    console.log(`  Develop branch:   ${GITFLOW_CONFIG.develop}`)
    console.log(`  Feature prefix:   ${GITFLOW_CONFIG.feature}`)
    console.log(`  Bugfix prefix:    ${GITFLOW_CONFIG.bugfix}`)
    console.log(`  Release prefix:   ${GITFLOW_CONFIG.release}`)
    console.log(`  Hotfix prefix:    ${GITFLOW_CONFIG.hotfix}`)
    console.log(`  Support prefix:   ${GITFLOW_CONFIG.support}`)
    console.log(`  Version tag:      ${GITFLOW_CONFIG.versiontag || '(none)'}`)
  } catch (error) {
    printWarning('Failed to initialize Git Flow automatically.')
    console.log('You can initialize manually with: git flow init')
    if (!silent) {
      process.exit(1)
    }
  }
}

initGitFlow()
