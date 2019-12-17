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

export interface ExecInstallContext {
  service: ServiceModel
  inputDir: string
  rootDir: string
  serviceDir: string
}

export const getServiceForInstallStep = <T extends InstallStep>(step: T): Constructable<GenericStep<T>> => {
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
    default:
      throw Error('Step not implemented!')
  }
}

export const execInstallStep = async (injector: Injector, step: InstallStep, context: ExecInstallContext) => {
  return await injector.getInstance(getServiceForInstallStep(step)).run(step, context)
}
