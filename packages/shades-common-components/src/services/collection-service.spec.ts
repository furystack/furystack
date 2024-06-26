import { using } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { CollectionService } from './collection-service.js'

const testEntries = [{ foo: 1 }, { foo: 2 }, { foo: 3 }]

describe('CollectionService', () => {
  describe('Selection', () => {
    it('Should add and remove selection', () => {
      using(new CollectionService({}), (collectionService) => {
        collectionService.data.setValue({ count: 3, entries: testEntries })
        testEntries.forEach((entry) => {
          expect(collectionService.isSelected(entry)).toBe(false)
        })

        collectionService.addToSelection(testEntries[0])

        expect(collectionService.isSelected(testEntries[0])).toBe(true)
        expect(collectionService.isSelected(testEntries[1])).toBe(false)
        expect(collectionService.isSelected(testEntries[2])).toBe(false)

        collectionService.removeFromSelection(testEntries[0])

        expect(collectionService.isSelected(testEntries[0])).toBe(false)

        collectionService.toggleSelection(testEntries[1])
        expect(collectionService.isSelected(testEntries[1])).toBe(true)
      })
    })
  })
})
