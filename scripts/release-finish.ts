import {
  runPrerequisiteChecks,
  fetchRemote,
  checkBranchUpToDate,
  isOnReleaseBranch,
  getReleaseVersion,
  execCommand,
  printSuccess,
  printInfo,
  printError,
  printGray,
} from './utils.ts'

const finishRelease = (): void => {
  // Run prerequisite checks
  if (!runPrerequisiteChecks()) {
    process.exit(1)
  }

  // Verify on a release branch
  if (!isOnReleaseBranch()) {
    printError('Not on a release branch.')
    console.log('Please checkout the release branch first, or start a new release with: yarn release:start')
    process.exit(1)
  }

  const version = getReleaseVersion()
  if (!version) {
    printError('Could not determine release version from branch name.')
    process.exit(1)
  }

  printInfo(`Finishing release ${version}...`)
  console.log('')

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

  // Finish the release
  try {
    // Use -m flag to set tag message automatically
    printInfo('Running git flow release finish...')
    execCommand(`git flow release finish -m "Release ${version}" ${version}`, { silent: true })

    printSuccess(`Release ${version} finished successfully!`)
    console.log('')

    // Push changes to remote
    printInfo('Pushing changes to remote...')

    printGray('  Pushing develop branch...')
    execCommand('git push origin develop', { silent: true })

    printGray('  Pushing master branch...')
    execCommand('git push origin master', { silent: true })

    printGray('  Pushing tags...')
    execCommand('git push origin --tags', { silent: true })

    console.log('')
    printSuccess('All changes pushed to remote!')
    console.log('')

    // Print summary
    console.log('Summary:')
    console.log(`  - Release ${version} merged into master and develop`)
    console.log(`  - Tag ${version} created`)
    console.log('  - All changes pushed to origin')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Create a GitHub release from the tag')
    console.log('  2. Publish packages to npm (if applicable)')
  } catch (error) {
    printError('Failed to finish release.')
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.log('')
    console.log('You may need to resolve merge conflicts manually.')
    console.log('After resolving, run:')
    console.log(`  git flow release finish -m "Release ${version}" ${version}`)
    console.log('  git push origin develop master --tags')
    process.exit(1)
  }
}

finishRelease()
