import { Injectable, Injector } from '@furystack/inject'
import { DockerInstall } from '../models/install-step'
import { readDockerContainers } from '../commands/read-docker-containers'
import '../services/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

export const dockerPrerequisites: Prerequisite[] = [
  async i => {
    try {
      await i.execAsync('docker', {})
    } catch (error) {
      return { success: false, message: 'Docker has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class DockerInstallStep implements GenericStep<DockerInstall> {
  prerequisites = dockerPrerequisites
  public run = async (step: DockerInstall, context: ExecInstallContext) => {
    const dockerContainers = await readDockerContainers(this.injector)
    if (!dockerContainers.map(d => d.Image).includes(step.imageName)) {
      // ToDo: Check me, volume mappings
      await this.injector.execAsync(
        `docker run ${step.imageName} ${
          step.portMappings
            ? step.portMappings.map(port => ` -d -p ${port.source}:${port.destination}/${port.type.toLowerCase()}`)
            : ''
        }`,
        { cwd: context.serviceDir, env: process.env },
      )
    }
  }

  constructor(private readonly injector: Injector) {}
}
