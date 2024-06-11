import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { deserializeQueryString, serializeToQueryString, serializeValue } from '@furystack/rest'
import { LocationService, useCustomSearchStateSerializer } from './location-service.js'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('LocationService', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld be constructed', () => {
    using(new Injector(), (i) => {
      const s = i.getInstance(LocationService)
      expect(s).toBeInstanceOf(LocationService)
    })
  })

  it('Shuld update state on events', () => {
    using(new Injector(), (i) => {
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

  describe('useSearchParam', () => {
    it('Should create observables lazily', () => {
      using(new Injector(), (i) => {
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

    it('Should return the default value, if not present in the query string', () => {
      using(new Injector(), (i) => {
        const service = i.getInstance(LocationService)
        const testSearchParam = service.useSearchParam('test', { value: 'foo' })
        expect(testSearchParam.getValue()).toEqual({ value: 'foo' })
      })
    })

    it('Should return the value from the query string', () => {
      using(new Injector(), (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue(1)}`)
        const testSearchParam = service.useSearchParam('test', 123)
        expect(testSearchParam.getValue()).toBe(1)
      })
    })

    it('should update the observable value on push / replace states', () => {
      using(new Injector(), (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue(1)}`)
        const testSearchParam = service.useSearchParam('test', 234)
        expect(testSearchParam.getValue()).toBe(1)
        history.replaceState(null, '', `/loc1?test=${serializeValue('2')}`)
        expect(testSearchParam.getValue()).toBe('2')
      })
    })

    it('Should update the URL based on search value change', () => {
      using(new Injector(), (i) => {
        const service = i.getInstance(LocationService)
        history.pushState(null, '', `/loc1?test=${serializeValue('2')}`)
        const testSearchParam = service.useSearchParam('test', '')
        testSearchParam.setValue('2')
        expect(location.search).toBe('?test=IjIi')
      })
    })

    it('Should use custom serializer and deserializer', () => {
      using(new Injector(), (i) => {
        const customSerializer = vi.fn((value: any) => serializeToQueryString(value))
        const customDeserializer = vi.fn((value: any) => deserializeQueryString(value))
        const locationService = i.getInstance(LocationService)
        const testSearchParam = locationService.useSearchParam('test', { value: 'foo' })

        useCustomSearchStateSerializer(i, customSerializer, customDeserializer)

        testSearchParam.setValue({ value: 'bar' })
        expect(customSerializer).toBeCalledWith({ test: { value: 'bar' } })
        expect(customDeserializer).toBeCalledWith('?test=eyJ2YWx1ZSI6ImJhciJ9')
      })
    })
  })
})
