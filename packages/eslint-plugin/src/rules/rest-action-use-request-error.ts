import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

export const restActionUseRequestError = createRule({
  name: 'rest-action-use-request-error',
  meta: {
    type: 'problem',
    docs: {
      description:
        'In REST action files, enforce using RequestError instead of Error for thrown exceptions. RequestError includes HTTP status codes needed for proper REST API error responses.',
    },
    messages: {
      useRequestError:
        'Use "throw new RequestError(message, statusCode)" instead of "throw new Error(...)". REST actions should throw RequestError with an appropriate HTTP status code.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const isActionFile = /[/\\]actions[/\\][^/\\]+\.ts$/.test(filename)

    if (!isActionFile) return {}

    return {
      ThrowStatement(node) {
        if (!node.argument) return
        if (node.argument.type !== AST_NODE_TYPES.NewExpression) return
        if (node.argument.callee.type !== AST_NODE_TYPES.Identifier) return

        if (node.argument.callee.name === 'Error') {
          context.report({ node: node.argument, messageId: 'useRequestError' })
        }
      },
    }
  },
})
