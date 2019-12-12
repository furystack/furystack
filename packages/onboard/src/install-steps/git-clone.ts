import { existsSync } from 'fs'
import { join } from 'path'
import { Injectable } from '@furystack/inject'
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

  public run = async (step: GitClone, context: ExecInstallContext) => {
    if (step.onExists && step.onExists !== 'fail') {
      if (existsSync(join(context.serviceDir))) {
        if (step.onExists === 'ignore') {
          return
        } else if (step.onExists === 'pull') {
          await execAsync(`git pull`, { cwd: context.serviceDir })
          return
        } else if (step.onExists === 'stash-and-pull') {
          await execAsync(`git stash`, { cwd: context.serviceDir })
          await execAsync(`git pull`, { cwd: context.serviceDir })
          await execAsync(`git stash pop`, { cwd: context.serviceDir })
        }
      }
    }

    await execAsync(
      `git clone ${step.branch ? `--single-branch --branch ${step.branch}` : ''} ${step.repository} ${
        context.service.appName
      }`,
      {
        cwd: context.rootDir,
      },
    )
  }
}
