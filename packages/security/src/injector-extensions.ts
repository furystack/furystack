import { Injector } from '@furystack/inject/dist/injector'
import { SecurityPolicy } from './security-policy'

declare module '@furystack/inject/dist/injector' {
  /**
   * Extended Injector with Password Policy related methods
   */
  export interface Injector {
    /**
     * Sets up the @furystack/security with the provided settings
     */
    usePasswordPolicy: (policy?: Partial<SecurityPolicy>) => this
  }
}

Injector.prototype.usePasswordPolicy = function (policy) {
  const plainPolicy = new SecurityPolicy()
  policy && Object.assign(plainPolicy, policy)
  this.setExplicitInstance(plainPolicy, SecurityPolicy)
  return this
}
