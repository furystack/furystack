import { Injectable } from '@furystack/inject'
import { DockerCommand } from '../models/install-step'
import { execAsync } from '../commands/exec-async'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'
import { dockerPrerequisites } from './docker-install'

@Injectable()
export class DockerCommandStep implements GenericStep<DockerCommand> {
  prerequisites = dockerPrerequisites
  public run = async (step: DockerCommand, context: ExecInstallContext) => {
    await execAsync(`docker ${step.command}`, { cwd: context.inputDir, env: process.env })
  }
}
