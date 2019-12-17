import { InstallStep } from './install-step'

export interface ServiceModel {
  appName: string
  installSteps: InstallStep[]
}
