import { Injector, Constructable } from '@furystack/inject'
import { InstallStep } from '../models/install-step'
import { ServiceModel } from '../models/service'
import { AddToPm2Step } from './add-to-pm2'
import { NpmInstallStep } from './npm-install'
import { DockerInstallStep } from './docker-install'
import { NpmScriptStep } from './npm-script'
import { GitCloneStep } from './git-clone'
import { MongoRestoreStep } from './mongo-restore'
import { BowerInstallStep } from './bower-install'
import { GenericStep } from './generic-step'
import { DownloadInputFileInstallStep } from './download-input-file'
import { DockerCommandStep } from './docker-command'
import { DockerComposeUpStep } from './docker-compose-up'

export interface ExecInstallContext {
  service: ServiceModel
  inputDir: string
  rootDir: string
  serviceDir: string
}

export const getServiceForInstallStep = <T extends InstallStep>(
  step: T,
  injector: Injector,
): Constructable<GenericStep<T>> => {
  switch (step.type) {
    case 'AddToPm2':
      return AddToPm2Step as Constructable<GenericStep<T>>
    case 'NpmInstall':
      return NpmInstallStep as Constructable<GenericStep<T>>
    case 'DockerInstall':
      return DockerInstallStep as Constructable<GenericStep<T>>
    case 'NpmScript':
      return NpmScriptStep as Constructable<GenericStep<T>>
    case 'GitClone':
      return GitCloneStep as Constructable<GenericStep<T>>
    case 'MongoRestore':
      return MongoRestoreStep as Constructable<GenericStep<T>>
    case 'BowerInstall':
      return BowerInstallStep as Constructable<GenericStep<T>>
    case 'DownloadInputFile':
      return DownloadInputFileInstallStep as Constructable<GenericStep<T>>
    case 'DockerCommand':
      return DockerCommandStep as Constructable<GenericStep<T>>
    case 'DockerComposeUp':
      return DockerComposeUpStep as Constructable<GenericStep<T>>
    default:
      injector.logger.error({
        scope: `execInstallStep/${step.type}`,
        message: 'Step for type is not implemented',
        data: { step },
      })
      throw Error(`Step '${step.type}' not implemented!`)
  }
}

export const execInstallStep = async (injector: Injector, step: InstallStep, context: ExecInstallContext) => {
  try {
    return await injector.getInstance(getServiceForInstallStep(step, injector)).run(step, context)
  } catch (error) {
    injector.logger.withScope(`execInstallStep/${context.service.appName}/${step.type}`).warning({
      message: `The step has been failed`,
      data: {
        step,
        service: context.service,
        error,
        errorString: error.toString(),
      },
    })
    throw error
  }
}
