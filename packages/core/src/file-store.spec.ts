import { readFile as nodeReadFile, writeFile as nodeWriteFile } from 'fs'
import { LoggerCollection } from '@furystack/logging'
import { FileStore } from './file-store'

class MockClass {
  public id!: number
  public value!: string
}

// tslint:disable:no-string-literal

const mockReadFile: (name: string, done: (err?: any) => void) => void = (_name, callback) => {
  callback()
}

const mockWriteFile: (name: string, value: any, done: (err?: any) => void) => void = (_name, _value, callback) => {
  callback()
}

describe('FileStore', () => {
  let f!: FileStore<MockClass>

  beforeEach(() => {
    f = new FileStore({
      fileName: 'example.txt',
      primaryKey: 'id',
      logger: new LoggerCollection(),
      model: MockClass,
      readFile: mockReadFile as any,
      writeFile: mockWriteFile as any,
    })
  })

  afterEach(() => {
    f.dispose()
  })

  it('should be constructed with default parameters', () => {
    const f2 = new FileStore({
      fileName: 'alma.txt',
      logger: new LoggerCollection(),
      model: MockClass,
      primaryKey: 'id',
    })
    expect(f2).toBeInstanceOf(FileStore)
    expect(f2.readFile).toBe(nodeReadFile)
    expect(f2.writeFile).toBe(nodeWriteFile)
    clearInterval(f2.tick)
  })

  it('Update should set a value', async () => {
    await f.update(1, { id: 1, value: 'asd' })
    const count = await f.count()
    expect(count).toBe(1)
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('Add should set a value', async () => {
    await f.add({ id: 1, value: 'asd' })
    const count = await f.count()
    expect(count).toBe(1)
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('Remove should remove a value', async () => {
    await f.add({ id: 1, value: 'asd' })
    await f.remove(1)
    const count = await f.count()
    expect(count).toBe(0)
  })

  it('Adding an item that already exists should throw an error', async () => {
    await f.add({ id: 1, value: 'asd' })

    try {
      await f.add({ id: 1, value: 'asd' })
      throw Error('Should throw')
    } catch (error) {
      /** */
    }

    const count = await f.count()
    expect(count).toBe(1)
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('save should be triggered after change', (done) => {
    f.writeFile = ((_name: string, _value: any, callback: () => void) => {
      callback()
      done()
    }) as any
    f.update(1, { id: 1, value: 'asd' })
  })

  it('filter should return the corresponding entries', async () => {
    f.update(1, { id: 1, value: 'asd' })
    f.update(2, { id: 2, value: 'def' })
    f.update(3, { id: 3, value: 'def' })

    const result = await f.search({ filter: { value: { $eq: 'def' } } })
    expect(result.length).toBe(2)
  })

  it('reload should fill the cache from the response', async () => {
    f.readFile = ((_name: string, callback: (err: any, data: string) => void) => {
      callback(undefined, JSON.stringify([{ id: 1, value: 'asd' }]))
    }) as any

    await f.reloadData()
    const count = await f.count()
    expect(count).toBe(1)
    const persisted = await f.get(1)
    expect(persisted).toEqual({ id: 1, value: 'asd' })
  })

  it('saveChanges should skip file writing on no changes', () => {
    f.hasChanges = false
    f.writeFile = ((_name: string, _value: any, _callback: (err: any) => void) => {
      throw Error("Shouldn't be triggered on no change!")
    }) as any
    f.saveChanges()
  })
})
