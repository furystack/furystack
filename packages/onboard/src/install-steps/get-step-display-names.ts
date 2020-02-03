import { InstallStep } from '../models/install-step'

export const getStepDisplayNames = (step: InstallStep) => {
  switch (step.type) {
    case 'AddToPm2':
      return `Adding script ${step.displayName} (${step.script}) to PM2`
    case 'NpmInstall':
      return `Installing NPM dependencies${step.path ? ` in ${step.path}...` : '...'}`
    case 'DockerInstall':
      return `Checking / installing Docker container '${step.imageName}'...`
    case 'NpmScript':
      return `Executing custom script '${step.scriptName}' ${step.path ? `in ${step.path}...` : '...'}`
    case 'GitClone':
      return `Cloning GIT repository '${step.repository}'`
    case 'MongoRestore':
      return `Restoring Mongo Database '${step.dbName}' from ${step.dumpPath}`
    case 'BowerInstall':
      return `Installing Bower dependencies${step.path ? ` in ${step.path}...` : '...'}`
    case 'DownloadInputFile':
      return `Downloading input file to ${step.destination}...`
    case 'DockerCommand':
      return `Executing Docker command '${step.command}'`
    case 'DockerComposeUp':
      return `Executing Docker-Compose UP...`
    default:
      return (step as any).type
  }
}
