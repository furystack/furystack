import type { TSESLint } from '@typescript-eslint/utils'
import { noDirectPhysicalStore } from './rules/no-direct-physical-store.js'
import { requireDisposableForObservableOwner } from './rules/require-disposable-for-observable-owner.js'
import { requireObservableDisposal } from './rules/require-observable-disposal.js'
import { preferUsingWrapper } from './rules/prefer-using-wrapper.js'
import { noModuleLevelJsx } from './rules/no-module-level-jsx.js'
import { noRemovedShadeApis } from './rules/no-removed-shade-apis.js'
import { validShadowDomName } from './rules/valid-shadow-dom-name.js'
import { preferUseState } from './rules/prefer-use-state.js'
import { noCssStateHooks } from './rules/no-css-state-hooks.js'
import { recommended } from './configs/recommended.js'
import { shades } from './configs/shades.js'

const rules = {
  'no-direct-physical-store': noDirectPhysicalStore,
  'require-disposable-for-observable-owner': requireDisposableForObservableOwner,
  'require-observable-disposal': requireObservableDisposal,
  'prefer-using-wrapper': preferUsingWrapper,
  'no-module-level-jsx': noModuleLevelJsx,
  'no-removed-shade-apis': noRemovedShadeApis,
  'valid-shadow-dom-name': validShadowDomName,
  'prefer-use-state': preferUseState,
  'no-css-state-hooks': noCssStateHooks,
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>

const plugin = {
  rules,
  configs: {
    recommended,
    shades,
  },
}

export default plugin
export { rules }
