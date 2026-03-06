import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

const isWrappedWithValidate = (node: TSESTree.Node): boolean => {
  // Validate({ ... })(action) -- a call expression whose callee is Validate(...)
  if (node.type === AST_NODE_TYPES.CallExpression && node.callee.type === AST_NODE_TYPES.CallExpression) {
    const innerCallee = node.callee.callee
    return innerCallee.type === AST_NODE_TYPES.Identifier && innerCallee.name === 'Validate'
  }
  return false
}

const isInsideUseRestServiceApi = (node: TSESTree.Property): boolean => {
  // Property -> ObjectExpression (method block) -> Property (HTTP method) -> ObjectExpression (api) -> Property (api key) -> ObjectExpression (useRestService arg) -> CallExpression
  const methodBlock = node.parent
  if (methodBlock?.type !== AST_NODE_TYPES.ObjectExpression) return false

  const methodProp = methodBlock.parent
  if (methodProp?.type !== AST_NODE_TYPES.Property) return false
  if (methodProp.key.type !== AST_NODE_TYPES.Identifier || !HTTP_METHODS.has(methodProp.key.name)) return false

  const apiObj = methodProp.parent
  if (apiObj?.type !== AST_NODE_TYPES.ObjectExpression) return false

  const apiProp = apiObj.parent
  if (apiProp?.type !== AST_NODE_TYPES.Property) return false
  if (apiProp.key.type !== AST_NODE_TYPES.Identifier || apiProp.key.name !== 'api') return false

  const restServiceArg = apiProp.parent
  if (restServiceArg?.type !== AST_NODE_TYPES.ObjectExpression) return false

  const restServiceCall = restServiceArg.parent
  return (
    restServiceCall?.type === AST_NODE_TYPES.CallExpression &&
    restServiceCall.callee.type === AST_NODE_TYPES.Identifier &&
    restServiceCall.callee.name === 'useRestService'
  )
}

/** Enforces that REST endpoint registrations in `useRestService()` are wrapped with `Validate()`. */
export const restActionValidateWrapper = createRule({
  name: 'rest-action-validate-wrapper',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce that REST endpoint registrations in useRestService() API definitions are wrapped with Validate() for request validation.',
    },
    messages: {
      missingValidate:
        'Endpoint "{{ endpoint }}" should be wrapped with Validate() for request validation (e.g. Validate({ schema, schemaName: "..." })(action)).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const isTestFile = /\.(spec|test)\.[jt]sx?$/.test(filename)
    if (isTestFile) return {}

    return {
      Property(node) {
        if (!isInsideUseRestServiceApi(node)) return

        if (node.key.type !== AST_NODE_TYPES.Literal || typeof node.key.value !== 'string') return

        if (!isWrappedWithValidate(node.value)) {
          context.report({
            node: node.value,
            messageId: 'missingValidate',
            data: { endpoint: node.key.value },
          })
        }
      },
    }
  },
})
