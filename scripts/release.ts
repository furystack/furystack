import * as readline from 'node:readline'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  runPrerequisiteChecks,
  fetchRemote,
  checkBranchUpToDate,
  getCurrentBranch,
  execCommand,
  printSuccess,
  printInfo,
  printError,
  printWarning,
  printGray,
} from './utils.ts'

const promptConfirm = async (message: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} [y/N]: `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

const getPackageVersion = (): string => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version: string }
  return packageJson.version
}

const hasUncommittedChanges = (): boolean => {
  try {
    const status = execCommand('git status --porcelain', { silent: true })
    return status.length > 0
  } catch {
    return false
  }
}

const hasPendingVersionBumps = (): boolean => {
  try {
    // Check if there are deferred version changes
    const result = execCommand('yarn version check', { silent: true })
    // If the command succeeds and has output about changes, there are pending bumps
    return result.includes('strategies') || result.includes('The following')
  } catch {
    return false
  }
}

const release = async (): Promise<void> => {
  console.log('')
  printInfo('Starting release process...')
  console.log('')

  // Step 1: Sanity checks
  printGray('Step 1/7: Running prerequisite checks...')
  if (!runPrerequisiteChecks()) {
    process.exit(1)
  }
  printSuccess('Prerequisites OK')

  // Step 2: Check we're on develop
  const currentBranch = getCurrentBranch()
  if (currentBranch !== 'develop') {
    printError(`Must be on 'develop' branch to start a release. Currently on: ${currentBranch}`)
    console.log('Run: git checkout develop')
    process.exit(1)
  }

  // Step 3: Fetch and check branches are up-to-date
  printGray('Step 2/7: Checking branch status...')
  fetchRemote()

  if (!checkBranchUpToDate('develop')) {
    process.exit(1)
  }

  if (!checkBranchUpToDate('master')) {
    process.exit(1)
  }
  printSuccess('Branches are up-to-date')

  // Step 4: Check for pending version bumps
  printGray('Step 3/7: Checking for pending version changes...')
  if (!hasPendingVersionBumps()) {
    printWarning('No pending version bumps detected.')
    console.log('Did you run: yarn bumpVersions')
    const proceed = await promptConfirm('Continue anyway?')
    if (!proceed) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  // Step 5: Apply release changes
  printGray('Step 4/7: Applying version bumps and changelog...')
  try {
    execCommand('yarn applyReleaseChanges')
  } catch (error) {
    printError('Failed to apply release changes.')
    if (error instanceof Error) {
      console.log(error.message)
    }
    process.exit(1)
  }
  printSuccess('Release changes applied')

  // Get version from package.json (after applying changes)
  const version = getPackageVersion()
  printInfo(`Release version: ${version}`)
  console.log('')

  // Step 6: Start the release
  printGray('Step 5/7: Starting git flow release...')
  try {
    execCommand(`git flow release start ${version}`, { silent: true })
  } catch (error) {
    printError(`Failed to start release ${version}.`)
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.log('')
    console.log('The release branch may already exist. Check with: git branch -a | grep release')
    process.exit(1)
  }
  printSuccess(`Release branch 'release/${version}' created`)

  // Step 7: Commit and push
  printGray('Step 6/7: Committing and pushing release branch...')
  if (hasUncommittedChanges()) {
    try {
      execCommand('git add -A', { silent: true })
      execCommand(`git commit -m "chore: prepare release ${version}"`, { silent: true })
      printSuccess('Changes committed')
    } catch (error) {
      printWarning('No changes to commit (this is OK if versions were already applied)')
    }
  }

  try {
    execCommand(`git push -u origin release/${version}`, { silent: true })
    printSuccess('Release branch pushed to origin')
  } catch (error) {
    printError('Failed to push release branch.')
    if (error instanceof Error) {
      console.log(error.message)
    }
    process.exit(1)
  }

  // Step 8: Confirmation before finishing
  console.log('')
  console.log('Release branch is ready for review:')
  console.log(`  Branch: release/${version}`)
  console.log(`  Version: ${version}`)
  console.log('')

  const confirmed = await promptConfirm('Finish the release and push to master/develop?')
  if (!confirmed) {
    console.log('')
    printInfo('Release paused. The release branch has been pushed.')
    console.log('When ready, run: yarn release:finish')
    process.exit(0)
  }

  // Step 9: Finish the release
  printGray('Step 7/7: Finishing release...')
  try {
    execCommand(`git flow release finish -m "Release ${version}" ${version}`, { silent: true })
    printSuccess('Release finished')
  } catch (error) {
    printError('Failed to finish release.')
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.log('')
    console.log('You may need to resolve merge conflicts manually.')
    console.log('After resolving, run: yarn release:finish')
    process.exit(1)
  }

  // Push everything
  printInfo('Pushing to remote...')
  printGray('  Pushing develop...')
  execCommand('git push origin develop', { silent: true })
  printGray('  Pushing master...')
  execCommand('git push origin master', { silent: true })
  printGray('  Pushing tags...')
  execCommand('git push origin --tags', { silent: true })

  console.log('')
  printSuccess(`Release ${version} completed successfully!`)
  console.log('')
  console.log('Summary:')
  console.log(`  - Version ${version} released`)
  console.log('  - Merged into master and develop')
  console.log(`  - Tag ${version} created and pushed`)
  console.log('')
  console.log('Next steps:')
  console.log('  1. Create a GitHub release from the tag')
  console.log('  2. Publish packages: npm publish (or your publish workflow)')
}

release().catch((error) => {
  console.error(error)
  process.exit(1)
})
