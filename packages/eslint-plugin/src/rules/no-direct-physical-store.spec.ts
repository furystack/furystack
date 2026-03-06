import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { noDirectPhysicalStore } from './no-direct-physical-store.js'

RuleTester.afterAll = afterAll
RuleTester.it = it
RuleTester.describe = describe

const tester = new RuleTester()

tester.run('no-direct-physical-store', noDirectPhysicalStore, {
  valid: [
    {
      name: 'getDataSetFor is allowed',
      code: `import { getDataSetFor } from '@furystack/repository'`,
    },
    {
      name: 'StoreManager in spec files is allowed',
      filename: 'packages/my-app/src/service.spec.ts',
      code: `import { StoreManager } from '@furystack/core'`,
    },
    {
      name: 'StoreManager in core package is allowed',
      filename: 'packages/core/src/store-manager.ts',
      code: `import { StoreManager } from '@furystack/core'`,
    },
    {
      name: 'StoreManager in store packages is allowed',
      filename: 'packages/mongodb-store/src/mongodb-store.ts',
      code: `import { StoreManager } from '@furystack/core'`,
    },
    {
      name: 'StoreManager in repository package is allowed',
      filename: 'packages/repository/src/data-set.ts',
      code: `import { StoreManager } from '@furystack/core'`,
    },
    {
      name: 'store-manager-helpers is allowed',
      filename: 'packages/filesystem-store/src/store-manager-helpers.ts',
      code: `import { StoreManager } from '@furystack/core'`,
    },
    {
      name: 'other imports from @furystack/core are fine',
      code: `import { addStore, InMemoryStore } from '@furystack/core'`,
    },
  ],
  invalid: [
    {
      name: 'StoreManager import in application code',
      filename: 'packages/my-app/src/my-service.ts',
      code: `import { StoreManager } from '@furystack/core'`,
      errors: [{ messageId: 'noStoreManagerImport' }],
    },
    {
      name: 'getStoreFor call in application code',
      filename: 'packages/my-app/src/my-service.ts',
      code: `const store = sm.getStoreFor(MyModel, 'id')`,
      errors: [{ messageId: 'noGetStoreFor' }],
    },
  ],
})
