import { join } from 'path'
import { NpmInstall } from '../models/install-step'
import { execAsync } from '../commands/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'
import { Injectable } from '@furystack/inject'

export const npmPrerequisites: Prerequisite[] = [
  async () => {
    if (!process.env.NPM_TOKEN || !process.env.NPM_TOKEN.length) {
      return { message: "The 'NPM_TOKEN' env.value has not been set.", success: false }
    }
  },
]

@Injectable()
export class NpmInstallStep implements GenericStep<NpmInstall> {
  prerequisites = npmPrerequisites
  public run = async (step: NpmInstall, context: ExecInstallContext) => {
    const dir = step.path ? join(context.serviceDir, step.path) : context.serviceDir
    await execAsync('npm install', { cwd: dir, env: process.env })
  }
}
