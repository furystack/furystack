import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { preferNestedRouteLink } from './prefer-nested-route-link.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('prefer-nested-route-link', preferNestedRouteLink, {
  valid: [
    {
      name: 'NestedRouteLink is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <NestedRouteLink path="/dashboard">Dashboard</NestedRouteLink>
        })
      `,
    },
    {
      name: 'external link with https is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="https://example.com">Example</a>
        })
      `,
    },
    {
      name: 'external link with http is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="http://example.com">Example</a>
        })
      `,
    },
    {
      name: 'anchor with target="_blank" is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="/external" target="_blank">Open</a>
        })
      `,
    },
    {
      name: 'dynamic href expression is ignored',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href={someVariable}>Link</a>
        })
      `,
    },
    {
      name: 'mailto link is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="mailto:test@example.com">Email</a>
        })
      `,
    },
    {
      name: 'hash link is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="#section">Section</a>
        })
      `,
    },
    {
      name: 'anchor with slash href outside Shade render is ignored',
      code: `
        function notAShade() {
          return <a href="/dashboard">Dashboard</a>
        }
      `,
    },
    {
      name: 'anchor without href is fine',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a>Anchor</a>
        })
      `,
    },
  ],
  invalid: [
    {
      name: 'raw <a href="/..."> inside Shade render',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="/dashboard">Dashboard</a>
        })
      `,
      errors: [{ messageId: 'preferNestedRouteLink' }],
    },
    {
      name: 'raw <a href="/..."> inside block-body Shade render',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => {
            return <a href="/users/123">User</a>
          }
        })
      `,
      errors: [{ messageId: 'preferNestedRouteLink' }],
    },
    {
      name: 'raw <a href="/"> home link inside Shade render',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => <a href="/">Home</a>
        })
      `,
      errors: [{ messageId: 'preferNestedRouteLink' }],
    },
    {
      name: 'nested inside JSX tree inside Shade render',
      code: `
        Shade({
          customElementName: 'my-comp',
          render: () => {
            return (
              <div>
                <nav>
                  <a href="/about">About</a>
                </nav>
              </div>
            )
          }
        })
      `,
      errors: [{ messageId: 'preferNestedRouteLink' }],
    },
  ],
})
