import { join } from 'path'
import { execAsync } from '../commands/exec-async'
import { BowerInstall } from '../models/install-step'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'
import { Injectable } from '@furystack/inject'

export const bowerPrerequisites: Prerequisite[] = [
  async () => {
    try {
      await execAsync('bower help', {})
    } catch (error) {
      return { success: false, message: 'Bower has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class BowerInstallStep implements GenericStep<BowerInstall> {
  prerequisites = bowerPrerequisites

  public run = async (step: BowerInstall, context: ExecInstallContext) => {
    const dir = step.path ? join(context.serviceDir, step.path) : context.serviceDir
    await execAsync('bower install', { env: process.env, cwd: dir })
  }
}
