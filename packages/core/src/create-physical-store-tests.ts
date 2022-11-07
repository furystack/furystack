import type { PhysicalStore } from './models/physical-store'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'

export class TestClass {
  id!: number
  stringValue1!: string
  stringValue2!: string
  numberValue1!: number
  numberValue2!: number
  booleanValue!: boolean
  dateValue!: Date
}

let idIndex = 0
export const createMockEntity = (part?: Partial<TestClass>) =>
  ({
    id: idIndex++,
    stringValue1: 'foo',
    stringValue2: 'bar',
    numberValue1: Math.round(Math.random() * 1000),
    numberValue2: Math.round(Math.random() * 10000) / 100,
    booleanValue: true,
    dateValue: new Date(),
    ...part,
  } as TestClass)

export interface StoreTestOptions<T, TPrimaryKey extends keyof T> {
  typeName: string
  createStore: (i: Injector) => PhysicalStore<T, TPrimaryKey>
  skipRegexTests?: boolean
  skipStringTests?: boolean
}

export const createStoreTest = (options: StoreTestOptions<TestClass, 'id'>) => {
  describe(`Standard Physical Store tests for '${options.typeName}'`, () => {
    describe('General CRUD', () => {
      it('Should be created with empty by default', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const count = await store.count()
          expect(count).toBe(0)
        })
      })

      it('Should be able to store an entity', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          const count = await store.count()
          expect(count).toBe(1)
        })
      })

      it('Should be able to store an entity without providing an unique Id', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const { id, ...entityWithoutId } = createMockEntity()
          const { created } = await store.add(entityWithoutId)
          expect(created.length).toBe(1)
          const count = await store.count()
          expect(count).toBe(1)
          const retrieved = await store.get(created[0].id)
          expect(retrieved).toEqual(created[0])
        })
      })

      it('Should be able to store multiple entities', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity1 = createMockEntity()
          const entity2 = createMockEntity()
          await store.add(entity1, entity2)
          const count = await store.count()
          expect(count).toBe(2)
        })
      })

      it('Add should throw and skip adding on duplicate IDs', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          await expect(store.add(entity)).rejects.toThrow()
          const count = await store.count()
          expect(count).toBe(1)
        })
      })

      it('Should return undefined if no entry has been found', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = await store.get(1)
          expect(entity).toBeUndefined()
        })
      })

      it('Should be able to retrieve an added entity', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          const retrieved = await store.get(entity.id)
          expect(retrieved).toEqual(entity)
        })
      })

      it('Should be able to retrieve an added entity with projection', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          const retrieved = await store.get(entity.id, ['id', 'stringValue1'])
          expect(retrieved).not.toEqual(entity)
          expect(Object.keys(retrieved as any)).toEqual(['id', 'stringValue1'])
          expect(retrieved?.id).toBe(entity.id)
          expect(retrieved?.stringValue1).toBe(entity.stringValue1)
        })
      })

      it('Should be able to update an added entity', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          await store.update(entity.id, { stringValue1: 'modified' })
          const retrieved = await store.get(entity.id)
          expect(retrieved?.stringValue1).toEqual('modified')
        })
      })

      it('Update should throw an error if the entity does not exists', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await expect(store.update(entity.id, entity)).rejects.toThrow('Entity not found')
        })
      })

      it('Should remove an entity', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity = createMockEntity()
          await store.add(entity)
          const count = await store.count()
          expect(count).toBe(1)
          await store.remove(entity.id)
          const countAferDelete = await store.count()
          expect(countAferDelete).toBe(0)
        })
      })

      it('Should remove multiple entities at once', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const entity1 = createMockEntity()
          const entity2 = createMockEntity()
          const entity3 = createMockEntity()
          await store.add(entity1, entity2, entity3)
          const count = await store.count()
          expect(count).toBe(3)
          await store.remove(entity1.id, entity2.id)
          const countAferDelete = await store.count()
          expect(countAferDelete).toBe(1)
          await store.remove(entity3.id)
          const countAferDeleteAll = await store.count()
          expect(countAferDeleteAll).toBe(0)
        })
      })
    })

    describe('Top, skip', () => {
      it('Should respect top and skip', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const store = options.createStore(injector)
          for (let i = 0; i < 10; i++) {
            await store.add(createMockEntity({ id: i }))
          }
          const zeroToThree = await store.find({ top: 4, select: ['id'] })
          expect(zeroToThree).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }])

          const fiveToEight = await store.find({ skip: 5, top: 4, select: ['id'] })
          expect(fiveToEight).toEqual([{ id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }])

          const eightNine = await store.find({ skip: 8, select: ['id'] })
          expect(eightNine).toEqual([{ id: 8 }, { id: 9 }])
        })
      })
    })
    describe('Ordering', () => {
      it('Should sort by numeric values', async () => {
        await usingAsync(new Injector(), async (injector) => {
          const store = options.createStore(injector)
          for (let i = 0; i < 10; i++) {
            await store.add(createMockEntity({ id: i, numberValue1: Math.random(), numberValue2: Math.random() }))
          }
          // For equality
          await store.add(createMockEntity({ id: 20, numberValue1: 0, numberValue2: 0 }))
          await store.add(createMockEntity({ id: 21, numberValue1: 0, numberValue2: 0 }))

          const orderByValue1Asc = await store.find({ order: { numberValue1: 'ASC' } })
          let min = 0
          for (const currentValue of orderByValue1Asc) {
            if (min > currentValue.numberValue1) {
              throw Error('Order failed!')
            }
            min = currentValue.numberValue1
          }

          const orderByValue1Desc = await store.find({ order: { numberValue1: 'DESC' } })
          let max = Number.MAX_SAFE_INTEGER
          for (const currentValue of orderByValue1Desc) {
            if (max < currentValue.numberValue1) {
              throw Error('Order failed!')
            }
            max = currentValue.numberValue1
          }
        })
      })
    })
    describe('Filtering', () => {
      it('should filter strings with $eq', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, stringValue1: 'asd' }),
            createMockEntity({ id: 2, stringValue1: 'def' }),
            createMockEntity({ id: 3, stringValue1: 'def' }),
          )
          const result = await store.find({ filter: { stringValue1: { $eq: 'def' } } })
          expect(result.length).toBe(2)
        })
      })

      it('should filter numbers with $eq', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, numberValue1: 1 }),
            createMockEntity({ id: 2, numberValue1: 2 }),
            createMockEntity({ id: 3, numberValue1: 2 }),
          )
          const result = await store.find({ filter: { numberValue1: { $eq: 2 } } })
          expect(result.length).toBe(2)
        })
      })

      it('filter should return the corresponding entries for multiple props', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, stringValue1: 'asd' }),
            createMockEntity({ id: 2, stringValue1: 'def', stringValue2: 'def' }),
            createMockEntity({ id: 3, stringValue1: 'def' }),
          )

          const result = await store.find({ filter: { stringValue1: { $eq: 'def' }, stringValue2: { $eq: 'def' } } })
          expect(result.length).toBe(1)
        })
      })

      it('filter should return the corresponding entries with $in statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ stringValue1: 'asd' }),
            createMockEntity({ stringValue1: 'def' }),
            createMockEntity({ stringValue1: 'sdf' }),
          )

          const result = await store.find({ filter: { stringValue1: { $in: ['asd', 'def'] } } })
          expect(result.length).toBe(2)
          expect(result.map((r) => r.stringValue1)).toEqual(['asd', 'def'])
        })
      })

      it('filter should return the corresponding entries with $nin statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, stringValue1: 'asd' }),
            createMockEntity({ id: 2, stringValue1: 'def' }),
            createMockEntity({ id: 3, stringValue1: 'sdf' }),
          )

          const result = await store.find({ filter: { stringValue1: { $nin: ['asd', 'def'] } } })
          expect(result.length).toBe(1)
          expect(result.map((r) => r.stringValue1)).toEqual(['sdf'])
        })
      })

      it('filter should return the corresponding entries with $ne statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, stringValue1: 'asd' }),
            createMockEntity({ id: 2, stringValue1: 'def' }),
            createMockEntity({ id: 3, stringValue1: 'sdf' }),
          )

          const result = await store.find({ filter: { stringValue1: { $ne: 'asd' } } })
          expect(result.length).toBe(2)
          expect(result.map((r) => r.stringValue1)).toEqual(['def', 'sdf'])
        })
      })

      it('filter should return the corresponding entries with $lt statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const { created } = await store.add(
            createMockEntity({ id: 1, numberValue1: 1 }),
            createMockEntity({ id: 2, numberValue1: 2 }),
            createMockEntity({ id: 3, numberValue1: 3 }),
          )

          const result = await store.find({ filter: { numberValue1: { $lt: 2 } } })
          expect(result.length).toBe(1)
          expect(result).toEqual([created[0]])
        })
      })

      it('filter should return the corresponding entries with $lte statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const { created } = await store.add(
            createMockEntity({ id: 1, numberValue1: 1 }),
            createMockEntity({ id: 2, numberValue1: 2 }),
            createMockEntity({ id: 3, numberValue1: 3 }),
          )

          const result = await store.find({ filter: { numberValue1: { $lte: 2 } } })
          expect(result.length).toBe(2)
          expect(result).toEqual([created[0], created[1]])
        })
      })

      it('filter should return the corresponding entries with $gt statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const { created } = await store.add(
            createMockEntity({ id: 1, numberValue1: 1 }),
            createMockEntity({ id: 2, numberValue1: 2 }),
            createMockEntity({ id: 3, numberValue1: 3 }),
          )

          const result = await store.find({ filter: { numberValue1: { $gt: 2 } } })
          expect(result.length).toBe(1)
          expect(result).toEqual([created[2]])
        })
      })

      it('filter should return the corresponding entries with $gte statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          const { created } = await store.add(
            createMockEntity({ id: 1, numberValue1: 1 }),
            createMockEntity({ id: 2, numberValue1: 2 }),
            createMockEntity({ id: 3, numberValue1: 3 }),
          )

          const result = await store.find({ filter: { numberValue1: { $gte: 2 } } })
          expect(result.length).toBe(2)
          expect(result).toEqual([created[1], created[2]])
        })
      })

      it('filter should return the corresponding entries with $in AND $eq statement', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ id: 1, stringValue1: 'asd' }),
            createMockEntity({ id: 2, stringValue1: 'def' }),
            createMockEntity({ id: 3, stringValue1: 'sdf' }),
          )

          const result = await store.find({ filter: { stringValue1: { $in: ['asd', 'def'], $eq: 'asd' } } })
          expect(result.length).toBe(1)
          expect(result.map((r) => r.stringValue1)).toEqual(['asd'])
        })
      })

      describe('logical $and statements', () => {
        it('should filter $and logical statements with $eq statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, numberValue1: 1, numberValue2: 1 }),
              createMockEntity({ id: 2, numberValue1: 2, numberValue2: 1 }),
              createMockEntity({ id: 3, numberValue1: 3, numberValue2: 1 }),
            )
            const result = await store.find({
              filter: { $and: [{ numberValue1: { $eq: 2 } }, { numberValue2: { $eq: 1 } }] },
            })
            expect(result.length).toBe(1)
            expect(result[0]).toEqual(created[1])
          })
        })

        it('should filter $and logical statements with $ne statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, numberValue1: 1, numberValue2: 2 }),
              createMockEntity({ id: 2, numberValue1: 2, numberValue2: 3 }),
              createMockEntity({ id: 3, numberValue1: 3, numberValue2: 1 }),
            )
            const result = await store.find({
              filter: { $and: [{ numberValue1: { $ne: 2 } }, { numberValue2: { $ne: 1 } }] },
            })
            expect(result.length).toBe(1)
            expect(result[0]).toEqual(created[0])
          })
        })

        it('should filter $and logical statements with $lt/$gt statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, numberValue1: 1, numberValue2: 2 }),
              createMockEntity({ id: 2, numberValue1: 2, numberValue2: 3 }),
              createMockEntity({ id: 3, numberValue1: 3, numberValue2: 1 }),
            )
            const result = await store.find({
              filter: { $and: [{ numberValue1: { $lt: 3 } }, { numberValue2: { $gt: 2 } }] },
            })
            expect(result.length).toBe(1)
            expect(result[0]).toEqual(created[1])
          })
        })

        it('should filter $and logical statements with $lte/$gte statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, numberValue1: 1, numberValue2: 1 }),
              createMockEntity({ id: 2, numberValue1: 2, numberValue2: 2 }),
              createMockEntity({ id: 3, numberValue1: 3, numberValue2: 3 }),
            )
            const result = await store.find({
              filter: { $and: [{ numberValue1: { $lte: 2 } }, { numberValue2: { $gte: 2 } }] },
            })
            expect(result.length).toBe(1)
            expect(result[0]).toEqual(created[1])
          })
        })
      })

      describe('logical $or statements', () => {
        it('should filter logical $or statements with $eq statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({
              filter: { $or: [{ stringValue1: { $eq: 'aaa' } }, { stringValue1: { $eq: 'bbb' } }] },
            })
            expect(result.length).toBe(2)
            expect(result).toEqual([created[1], created[2]])
          })
        })

        it('should filter logical $or statements with $neq statements', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({
              filter: { $or: [{ stringValue1: { $ne: 'aaa' } }, { stringValue1: { $ne: 'bbb' } }] },
            })
            expect(result.length).toBe(3)
            expect(result).toEqual(created)
          })
        })
      })

      describe('Nested $or and $and logical operators', () => {
        it('should filter $and operators inside $or-s', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            const { created } = await store.add(
              createMockEntity({ id: 1, numberValue1: 1, numberValue2: 3, booleanValue: true }),
              createMockEntity({ id: 2, numberValue1: 2, numberValue2: 2, booleanValue: false }),
              createMockEntity({ id: 3, numberValue1: 3, numberValue2: 1, booleanValue: true }),
            )

            const result = await store.find({
              filter: {
                $or: [
                  {
                    $and: [{ numberValue1: { $ne: 2 } }, { numberValue2: { $eq: 1 } }],
                  },
                  {
                    $and: [{ numberValue1: { $ne: 3 } }, { booleanValue: { $ne: true } }],
                  },
                ],
              },
            })
            expect(result.length).toBe(2)
            expect(result).toEqual([created[1], created[2]])
          })
        })
      })

      if (!options.skipRegexTests) {
        it('filter should return the corresponding entries with $regex', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({ filter: { stringValue1: { $regex: '([a])' } } })
            expect(result.length).toBe(2)
            expect(result.map((r) => r.stringValue1)).toEqual(['asd', 'aaa'])
          })
        })
      }

      if (!options.skipStringTests) {
        it('filter should return the corresponding entries with $startsWith', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({ filter: { stringValue1: { $startsWith: 'aa' } } })
            expect(result.length).toBe(1)
            expect(result.map((r) => r.stringValue1)).toEqual(['aaa'])
          })
        })
        it('filter should return the corresponding entries with $endsWith', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({ filter: { stringValue1: { $endsWith: 'bb' } } })
            expect(result.length).toBe(1)
            expect(result.map((r) => r.stringValue1)).toEqual(['bbb'])
          })
        })

        it('filter should return the corresponding entries with $like', async () => {
          await usingAsync(new Injector(), async (i) => {
            const store = options.createStore(i)
            await store.add(
              createMockEntity({ id: 1, stringValue1: 'asd' }),
              createMockEntity({ id: 2, stringValue1: 'aaa' }),
              createMockEntity({ id: 3, stringValue1: 'bbb' }),
            )

            const result = await store.find({ filter: { stringValue1: { $like: '%a%' } } })
            expect(result.length).toBe(2)
            expect(result.map((r) => r.stringValue1)).toEqual(['asd', 'aaa'])

            const endsWithAResult = await store.find({ filter: { stringValue1: { $like: '%a' } } })
            expect(endsWithAResult.length).toBe(1)
            expect(endsWithAResult.map((r) => r.stringValue1)).toEqual(['aaa'])

            const startsWithAResult = await store.find({ filter: { stringValue1: { $like: 'a%' } } })
            expect(startsWithAResult.length).toBe(2)
            expect(startsWithAResult.map((r) => r.stringValue1)).toEqual(['asd', 'aaa'])
          })
        })
      }
    })

    describe('Count', () => {
      it('Should return the count', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(createMockEntity(), createMockEntity(), createMockEntity())
          const count = await store.count()
          expect(count).toBe(3)
        })
      })
      it('Should respect filters', async () => {
        await usingAsync(new Injector(), async (i) => {
          const store = options.createStore(i)
          await store.add(
            createMockEntity({ numberValue1: 1 }),
            createMockEntity({ numberValue1: 1 }),
            createMockEntity({ numberValue1: 2 }),
          )

          const count = await store.count({ numberValue1: { $eq: 1 } })
          expect(count).toBe(2)

          const count2 = await store.count({ numberValue1: { $eq: 2 } })
          expect(count2).toBe(1)
        })
      })
    })
  })
}
