import { join } from 'path'
import { Injectable, Injector } from '@furystack/inject'
import { NpmScript } from '../models/install-step'
import '../services/exec-async'
import { ExecInstallContext } from './exec-install-step'
import { GenericStep } from './generic-step'
import { npmPrerequisites } from './npm-install'

@Injectable()
export class NpmScriptStep implements GenericStep<NpmScript> {
  prerequisites = npmPrerequisites

  public run = async (step: NpmScript, context: ExecInstallContext) => {
    const dir = step.path ? join(context.serviceDir, step.path) : context.serviceDir
    await this.injector.execAsync(`npm run ${step.scriptName}`, { cwd: dir })
  }

  constructor(private readonly injector: Injector) {}
}
