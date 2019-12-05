import { Injector, Injectable } from '@furystack/inject'
import { ServiceModel } from '../models/service'
import { InstallStep } from '../models/install-step'
import { getServiceForInstallStep } from '../install-steps/exec-install-step'

export type Prerequisite = (injector: Injector) => Promise<{ message: string; success: false } | undefined>

export const genericPrerequisites: Prerequisite[] = [
  async () => {
    if (!process.env.NVM_DIR || !process.env.NVM_DIR.length) {
      return { message: "The 'NVM_DIR' env.value has not been set. Have you installed NVM?", success: false }
    }
  },
]

@Injectable({ lifetime: 'singleton' })
export class CheckPrerequisitesService {
  private cached = new Set<Prerequisite>()
  public async check(...prereqs: Prerequisite[]): Promise<string[]> {
    const promises = prereqs
      .filter(pr => {
        if (!this.cached.has(pr)) {
          this.cached.add(pr)
          return true
        }
        return false
      })
      .map(pr => pr(this.injector))
    const result = await Promise.all(promises)
    const errors = result
      .filter(r => r && r.success === false)
      .map(r => (r && r.message) || 'Prerequisite check failed.')
    return errors
  }

  public async checkPrerequisiteForServices(...args: ServiceModel[]) {
    const prereqs = args
      .map(service => service.installSteps)
      .reduce((prev, current) => [...prev, ...current], [] as InstallStep[])
      .map(step => getServiceForInstallStep(step))
      .map(step => this.injector.getInstance(step))
      .filter(step => step.prerequisites && step.prerequisites.length)
      .reduce<Prerequisite[]>((prev, current) => [...prev, ...(current.prerequisites as Prerequisite[])], [])

    return await this.check(...prereqs)
  }

  constructor(private readonly injector: Injector) {}
}
