import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/utils'
import { createRule } from '../create-rule.js'

const getInjectedDecoratorArg = (decorators: TSESTree.Decorator[] | undefined): TSESTree.Expression | null => {
  if (!decorators) return null

  for (const decorator of decorators) {
    if (
      decorator.expression.type === AST_NODE_TYPES.CallExpression &&
      decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
      decorator.expression.callee.name === 'Injected' &&
      decorator.expression.arguments.length === 1
    ) {
      const arg = decorator.expression.arguments[0]
      if (arg.type === AST_NODE_TYPES.SpreadElement) return null
      return arg
    }
  }
  return null
}

const getTypeAnnotationName = (typeAnnotation: TSESTree.TypeNode | undefined): string | null => {
  if (!typeAnnotation) return null

  if (
    typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
    typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier
  ) {
    return typeAnnotation.typeName.name
  }

  return null
}

/** Ensures `@Injected()` properties use `declare` and that the type matches the constructor argument. */
export const injectableConsistentInject = createRule({
  name: 'injectable-consistent-inject',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ensure @Injected() decorated properties use the declare keyword and that the type annotation matches the constructor argument when a class reference is used.',
    },
    messages: {
      missingDeclare:
        '@Injected() properties should use the "declare" keyword (e.g. declare private readonly {{ name }}: {{ type }}).',
      typeMismatch:
        '@Injected({{ decoratorArg }}) type mismatch: property "{{ name }}" is typed as "{{ propertyType }}" but the injected class is "{{ decoratorArg }}".',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      PropertyDefinition(node) {
        const injectedArg = getInjectedDecoratorArg(node.decorators)
        if (!injectedArg) return

        const propertyName = node.key.type === AST_NODE_TYPES.Identifier ? node.key.name : '<computed>'

        if (!node.declare) {
          const typeName = getTypeAnnotationName(node.typeAnnotation?.typeAnnotation) ?? 'unknown'
          context.report({
            node: node.key,
            messageId: 'missingDeclare',
            data: { name: propertyName, type: typeName },
          })
        }

        // Only check type match for constructor references (identifiers), not factory functions
        if (injectedArg.type === AST_NODE_TYPES.Identifier) {
          const decoratorClassName = injectedArg.name
          const propertyTypeName = getTypeAnnotationName(node.typeAnnotation?.typeAnnotation)

          if (propertyTypeName && propertyTypeName !== decoratorClassName) {
            context.report({
              node: node.key,
              messageId: 'typeMismatch',
              data: {
                decoratorArg: decoratorClassName,
                name: propertyName,
                propertyType: propertyTypeName,
              },
            })
          }
        }
      },
    }
  },
})
