import { Injector } from '@furystack/inject'
import { deserializeQueryString, serializeToQueryString, serializeValue } from '@furystack/rest'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocationService, useCustomSearchStateSerializer } from './location-service.js'

describe('LocationService', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld be constructed', async () => {
    await usingAsync(new Injector(), async (i) => {
      const s = i.getInstance(LocationService)
      expect(s).toBeInstanceOf(LocationService)
    })
  })

  it('Shuld update state on events', async () => {
    await usingAsync(new Injector(), async (i) => {
      const onLocaionChanged = vi.fn()
      const s = i.getInstance(LocationService)
      s.onLocationPathChanged.subscribe(onLocaionChanged)
      expect(onLocaionChanged).toBeCalledTimes(0)
      history.pushState(null, '', '/loc1')
      expect(onLocaionChanged).toBeCalledTimes(1)
      history.replaceState(null, '', '/loc2')
      expect(onLocaionChanged).toBeCalledTimes(2)

      // TODO: Figure out testing hashchange and popstate subscriptions
      // window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: '/loc3' }))
      // expect(onLocaionChanged).toBeCalledTimes(3)
      // window.dispatchEvent(new PopStateEvent('popstate', {}))
      // expect(onLocaionChanged).toBeCalledTimes(4)
    })
  })

  it('Should update location path when navigate is called', async () => {
    await usingAsync(new Injector(), async (i) => {
      const onLocationChanged = vi.fn()
      const s = i.getInstance(LocationService)
      s.onLocationPathChanged.subscribe(onLocationChanged)
      s.navigate('/dashboard')
      expect(s.onLocationPathChanged.getValue()).toBe('/dashboard')
      expect(onLocationChanged).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('useSearchParam', () => {
    it('Should create observables lazily', async () => {
      await usingAsync(new Injector(), async (i) => {
        const service = i.getInstance(LocationService)
        const observables = service.searchParamObservables

        const testSearchParam = service.useSearchParam('test', null)
        expect(observables.size).toBe(1)

        const testSearchParam2 = service.useSearchParam('test', null)
        expect(observables.size).toBe(1)

        expect(testSearchParam).toBe(testSearchParam2)

        const testSearchParam3 = service.useSearchParam('test2', undefined)
        expect(observables.size).toBe(2)

        expect(testSearchParam3).not.toBe(testSearchParam2)
      })
    })

    it('Should return the default value, if not present in the query string', async () => {
      await usingAsync(new Injector(), async (i) => {
        const service = i.getInstance(LocationService)
        const testSearchParam = service.useSearchParam('test', { value: 'foo' })
        expect(testSearchParam.getValue()).toEqual({ value: 'foo' })
      })
    })

    it('Should return the value from the query string', async () => {
      await usingAsync(new Injector(), async (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue(1)}`)
        const testSearchParam = service.useSearchParam('test', 123)
        expect(testSearchParam.getValue()).toBe(1)
      })
    })

    it('should update the observable value on push / replace states', async () => {
      await usingAsync(new Injector(), async (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue(1)}`)
        const testSearchParam = service.useSearchParam('test', 234)
        expect(testSearchParam.getValue()).toBe(1)
        history.replaceState(null, '', `/loc1?test=${serializeValue('2')}`)
        expect(testSearchParam.getValue()).toBe('2')
      })
    })

    it('Should update the URL based on search value change', async () => {
      await usingAsync(new Injector(), async (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue('2')}`)
        const testSearchParam = service.useSearchParam('test', '')
        testSearchParam.setValue('2')
        expect(location.search).toBe('?test=IjIi')
      })
    })

    it('Should throw an error when trying to use a custom serializer after LocationService has been instantiated', async () => {
      await usingAsync(new Injector(), async (i) => {
        const customSerializer = vi.fn((value: any) => serializeToQueryString(value))
        const customDeserializer = vi.fn((value: string) => deserializeQueryString(value))
        i.getInstance(LocationService)
        expect(() => useCustomSearchStateSerializer(i, customSerializer, customDeserializer)).toThrowError(
          'useCustomSearchStateSerializer must be called before the LocationService is instantiated',
        )
      })
    })

    it('Should use custom serializer and deserializer', async () => {
      await usingAsync(new Injector(), async (i) => {
        const customSerializer = vi.fn((value: any) => serializeToQueryString(value))
        const customDeserializer = vi.fn((value: string) => deserializeQueryString(value))

        useCustomSearchStateSerializer(i, customSerializer, customDeserializer)

        const locationService = i.getInstance(LocationService)
        const testSearchParam = locationService.useSearchParam('test', { value: 'foo' })

        testSearchParam.setValue({ value: 'bar' })
        expect(customSerializer).toBeCalledWith({ test: { value: 'bar' } })
        expect(customDeserializer).toBeCalledWith('?test=eyJ2YWx1ZSI6ImJhciJ9')
      })
    })
  })
})
