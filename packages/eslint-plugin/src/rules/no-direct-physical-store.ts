import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'
import { getTypeServices, isDefinitelyNotType } from '../utils/type-services.js'

const ALLOWED_PATH_PATTERNS = [
  /\.spec\.tsx?$/,
  /packages[/\\]core[/\\]/,
  /packages[/\\]repository[/\\]/,
  /[-\w]*store[/\\]/,
  /store-manager-helpers\.ts$/,
]

export const noDirectPhysicalStore = createRule({
  name: 'no-direct-physical-store',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Prefer getDataSetFor() from @furystack/repository over direct StoreManager.getStoreFor(). Direct PhysicalStore access bypasses authorization, modification hooks, and entity sync events.',
    },
    messages: {
      noStoreManagerImport:
        'Avoid importing StoreManager in application code. Use getDataSetFor() from @furystack/repository instead.',
      noGetStoreFor:
        'Avoid calling getStoreFor() in application code. Use getDataSetFor() from @furystack/repository instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename ?? context.getFilename()

    if (ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(filename))) {
      return {}
    }

    const typeServices = getTypeServices(context)

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@furystack/core') return

        for (const specifier of node.specifiers) {
          if (
            specifier.type === AST_NODE_TYPES.ImportSpecifier &&
            specifier.imported.type === AST_NODE_TYPES.Identifier &&
            specifier.imported.name === 'StoreManager'
          ) {
            context.report({ node: specifier, messageId: 'noStoreManagerImport' })
          }
        }
      },
      MemberExpression(node) {
        if (
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === 'getStoreFor' &&
          node.parent.type === AST_NODE_TYPES.CallExpression &&
          node.parent.callee === node
        ) {
          if (typeServices && isDefinitelyNotType(typeServices, node.object, ['StoreManager'])) return

          context.report({ node, messageId: 'noGetStoreFor' })
        }
      },
    }
  },
})
