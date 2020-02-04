import { existsSync } from 'fs'
import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { GitClone } from '../models/install-step'
import { execAsync } from '../commands/exec-async'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'

export const gitPrerequisites: Prerequisite[] = [
  async () => {
    try {
      await execAsync('git help', {})
    } catch (error) {
      return { success: false, message: 'Git has not been found. Have you installed it?' }
    }
  },
]

@Injectable()
export class GitCloneStep implements GenericStep<GitClone> {
  prerequisites = gitPrerequisites

  private logger: ScopedLogger

  public run = async (step: GitClone, context: ExecInstallContext) => {
    if (step.onExists && step.onExists !== 'fail') {
      if (existsSync(join(context.serviceDir))) {
        if (step.onExists === 'ignore') {
          this.logger.verbose({
            message: 'The GIT repository has already been cloned, ignoring...',
            data: { step, service: context.service },
          })
          return
        } else if (step.onExists === 'pull') {
          this.logger.verbose({ message: 'Pulling GIT changes...', data: { step, service: context.service } })
          await execAsync(`git pull`, { cwd: context.serviceDir })
          return
        } else if (step.onExists === 'stash-and-pull') {
          const result = await execAsync('git status -v --porcelain', { cwd: context.serviceDir })
          const hasChanges = result.trim().length > 0

          if (hasChanges) {
            this.logger.verbose({
              message: 'Changes detected, executing STASH...',
              data: { step, service: context.service },
            })
            await execAsync(`git stash`, { cwd: context.serviceDir })
          }
          this.logger.verbose({ message: 'Pulling GIT changes...', data: { step, service: context.service } })
          await execAsync(`git pull`, { cwd: context.serviceDir })
          return
        }
      }
    }

    this.logger.verbose({ message: `Cloning a new GIT repository to '${context.serviceDir}'...`, data: step })

    await execAsync(
      `git clone ${step.branch ? `--single-branch --branch ${step.branch}` : ''} ${step.repository} ${
        context.service.appName
      }`,
      {
        cwd: context.rootDir,
      },
    )
  }

  constructor(injector: Injector) {
    this.logger = injector.logger.withScope(this.constructor.name)
  }
}
