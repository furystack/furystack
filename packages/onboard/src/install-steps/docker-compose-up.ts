import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { DockerComposeUp } from '../models/install-step'
import '../services/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

export const dockerComposePrerequisites: Prerequisite[] = [
  async (injector) => {
    try {
      await injector.execAsync('docker-compose version', {})
    } catch (error) {
      return { success: false, message: 'Docker-compose has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class DockerComposeUpStep implements GenericStep<DockerComposeUp> {
  prerequisites = dockerComposePrerequisites
  public run = async (step: DockerComposeUp, context: ExecInstallContext) => {
    await this.injector.execAsync(`docker-compose -f ${join(context.inputDir, step.composeFile)} up -d`, {
      cwd: context.inputDir,
      env: process.env,
    })
  }

  constructor(private readonly injector: Injector) {}
}
