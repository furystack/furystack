import type { ESLint } from 'eslint'
import type { TSESLint } from '@typescript-eslint/utils'
import { recommended, recommendedStrict } from './configs/recommended.js'
import { shades, shadesStrict } from './configs/shades.js'
import { noCssStateHooks } from './rules/no-css-state-hooks.js'
import { noDirectGetValueInRender } from './rules/no-direct-get-value-in-render.js'
import { noDirectPhysicalStore } from './rules/no-direct-physical-store.js'
import { noManualSubscribeInRender } from './rules/no-manual-subscribe-in-render.js'
import { noModuleLevelJsx } from './rules/no-module-level-jsx.js'
import { noRemovedShadeApis } from './rules/no-removed-shade-apis.js'
import { preferLocationService } from './rules/prefer-location-service.js'
import { preferNestedRouteLink } from './rules/prefer-nested-route-link.js'
import { preferUseState } from './rules/prefer-use-state.js'
import { preferUsingWrapper } from './rules/prefer-using-wrapper.js'
import { requireDisposableForObservableOwner } from './rules/require-disposable-for-observable-owner.js'
import { requireObservableDisposal } from './rules/require-observable-disposal.js'
import { requireTabindexWithSpatialNavTarget } from './rules/require-tabindex-with-spatial-nav-target.js'
import { requireUseObservableForRender } from './rules/require-use-observable-for-render.js'
import { restActionUseRequestError } from './rules/rest-action-use-request-error.js'
import { restActionValidateWrapper } from './rules/rest-action-validate-wrapper.js'
import { restNoTypeCast } from './rules/rest-no-type-cast.js'
import { routerNoTypeCast } from './rules/router-no-type-cast.js'
import { validCustomElementName } from './rules/valid-custom-element-name.js'

const rules = {
  'no-css-state-hooks': noCssStateHooks,
  'no-direct-get-value-in-render': noDirectGetValueInRender,
  'no-direct-physical-store': noDirectPhysicalStore,
  'no-manual-subscribe-in-render': noManualSubscribeInRender,
  'no-module-level-jsx': noModuleLevelJsx,
  'no-removed-shade-apis': noRemovedShadeApis,
  'prefer-location-service': preferLocationService,
  'prefer-nested-route-link': preferNestedRouteLink,
  'prefer-use-state': preferUseState,
  'prefer-using-wrapper': preferUsingWrapper,
  'require-disposable-for-observable-owner': requireDisposableForObservableOwner,
  'require-observable-disposal': requireObservableDisposal,
  'require-tabindex-with-spatial-nav-target': requireTabindexWithSpatialNavTarget,
  'require-use-observable-for-render': requireUseObservableForRender,
  'rest-action-use-request-error': restActionUseRequestError,
  'rest-action-validate-wrapper': restActionValidateWrapper,
  'rest-no-type-cast': restNoTypeCast,
  'router-no-type-cast': routerNoTypeCast,
  'valid-custom-element-name': validCustomElementName,
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

// https://github.com/typescript-eslint/typescript-eslint/issues/11543
export default plugin as ESLint.Plugin & typeof plugin
export { rules }
