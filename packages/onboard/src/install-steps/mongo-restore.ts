import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { MongoRestore } from '../models/install-step'
import '../services/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

export const mongoPrerequisites: Prerequisite[] = [
  async i => {
    try {
      await i.execAsync('mongorestore --help', {})
    } catch (error) {
      return { success: false, message: '"mongorestore" has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class MongoRestoreStep implements GenericStep<MongoRestore> {
  prerequisites = mongoPrerequisites
  public run = async (step: MongoRestore, context: ExecInstallContext) => {
    await this.injector.execAsync(
      `mongorestore${step.drop ? ' --drop' : ' --quiet'}${step.uri ? `--uri="${step.uri}"` : ''} -d ${
        step.dbName
      } ${join(context.inputDir, step.dumpPath)} `,
      {
        maxBuffer: 1024 * 1024 * 10,
        cwd: context.inputDir,
      },
    )
  }

  constructor(private readonly injector: Injector) {}
}
