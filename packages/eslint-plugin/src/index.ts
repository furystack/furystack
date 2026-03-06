import type { TSESLint } from '@typescript-eslint/utils'
import { recommended, recommendedStrict } from './configs/recommended.js'
import { shades, shadesStrict } from './configs/shades.js'
import { injectableConsistentInject } from './rules/injectable-consistent-inject.js'
import { noCssStateHooks } from './rules/no-css-state-hooks.js'
import { noDirectGetValueInRender } from './rules/no-direct-get-value-in-render.js'
import { noDirectPhysicalStore } from './rules/no-direct-physical-store.js'
import { noManualSubscribeInRender } from './rules/no-manual-subscribe-in-render.js'
import { noModuleLevelJsx } from './rules/no-module-level-jsx.js'
import { noRemovedShadeApis } from './rules/no-removed-shade-apis.js'
import { preferUseState } from './rules/prefer-use-state.js'
import { preferUsingWrapper } from './rules/prefer-using-wrapper.js'
import { requireDisposableForObservableOwner } from './rules/require-disposable-for-observable-owner.js'
import { requireObservableDisposal } from './rules/require-observable-disposal.js'
import { requireUseObservableForRender } from './rules/require-use-observable-for-render.js'
import { restActionUseRequestError } from './rules/rest-action-use-request-error.js'
import { restActionValidateWrapper } from './rules/rest-action-validate-wrapper.js'
import { validShadowDomName } from './rules/valid-shadow-dom-name.js'

const rules = {
  'injectable-consistent-inject': injectableConsistentInject,
  'no-css-state-hooks': noCssStateHooks,
  'no-direct-get-value-in-render': noDirectGetValueInRender,
  'no-direct-physical-store': noDirectPhysicalStore,
  'no-manual-subscribe-in-render': noManualSubscribeInRender,
  'no-module-level-jsx': noModuleLevelJsx,
  'no-removed-shade-apis': noRemovedShadeApis,
  'prefer-use-state': preferUseState,
  'prefer-using-wrapper': preferUsingWrapper,
  'require-disposable-for-observable-owner': requireDisposableForObservableOwner,
  'require-observable-disposal': requireObservableDisposal,
  'require-use-observable-for-render': requireUseObservableForRender,
  'rest-action-use-request-error': restActionUseRequestError,
  'rest-action-validate-wrapper': restActionValidateWrapper,
  'valid-shadow-dom-name': validShadowDomName,
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>

const plugin = {
  rules,
  configs: {
    recommended,
    recommendedStrict,
    shades,
    shadesStrict,
  },
}

export default plugin
export { rules }
