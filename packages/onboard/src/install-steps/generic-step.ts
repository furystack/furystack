import { InstallStep } from '../models/install-step'
import { Prerequisite } from '../services/check-prerequisites'
import { ExecInstallContext } from './exec-install-step'

export interface GenericStep<T extends InstallStep> {
  run: (stepOptions: T, context: ExecInstallContext) => Promise<void>
  prerequisites?: Prerequisite[]
}
