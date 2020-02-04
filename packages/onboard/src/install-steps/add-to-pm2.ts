import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { AddToPm2 } from '../models/install-step'
import { execAsync } from '../commands/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { GenericStep } from './generic-step'
import { ExecInstallContext } from './exec-install-step'

const pm2Prerequisites: Prerequisite[] = [
  async () => {
    try {
      await await execAsync('pm2 -h', {})
    } catch (error) {
      return { success: false, message: 'PM2 has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class AddToPm2Step implements GenericStep<AddToPm2> {
  public prerequisites = pm2Prerequisites
  private logger: ScopedLogger
  public async run(step: AddToPm2, context: ExecInstallContext) {
    const pm2InfoText = await execAsync('pm2 jlist', { maxBuffer: 1024 * 1024 * 10 })

    const pm2Info: any[] = JSON.parse(pm2InfoText)

    if (pm2Info.find(entry => entry.name === step.displayName)) {
      this.logger.verbose({
        message: `The entry '${step.displayName}' has already been added to PM2, skipping...`,
        data: { step },
      })
      return
    }

    await execAsync(
      `pm2 start ${join(context.serviceDir, step.script)} --silent --restart-delay 10000 --cwd=${
        context.serviceDir
      } --name=${step.displayName}`,
      {
        cwd: context.serviceDir,
      },
    )

    this.logger.verbose({
      message: `The entry '${step.displayName}' hasbeen added to PM2.`,
      data: { step },
    })
  }

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope(this.constructor.name)
  }
}
