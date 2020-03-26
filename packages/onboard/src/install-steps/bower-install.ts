import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import '../services/exec-async'
import { BowerInstall } from '../models/install-step'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

export const bowerPrerequisites: Prerequisite[] = [
  async (i) => {
    try {
      await i.execAsync('bower help', {})
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
    await this.injector.execAsync('bower install', { env: process.env, cwd: dir })
  }

  constructor(private readonly injector: Injector) {}
}
