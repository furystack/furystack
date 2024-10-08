import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initializeShadeRoot } from '../initialize.js'
import { LocationService } from '../services/location-service.js'
import { createComponent } from '../shade-component.js'
import { RouteLink } from './route-link.js'
import { Router, type Route } from './router.js'

describe('Router', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('Shuld display the loader and completed state', async () => {
    history.pushState(null, '', '/')

    const onVisit = vi.fn()
    const onLeave = vi.fn()
    const onLastLeave = vi.fn()

    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const onRouteChange = vi.fn()

    injector.getInstance(LocationService).onLocationPathChanged.subscribe(onRouteChange)

    const route1: Route = {
      url: '/route-a',
      component: () => <div id="content">route-a</div>,
      onVisit,
      onLeave,
    }

    const route2: Route<{ id: string }> = {
      url: '/route-b{/:id}',
      component: ({ match }) => <div id="content">route-b{match.params.id}</div>,
    }

    const route3: Route = {
      url: '/route-c',
      component: () => <div id="content">route-c</div>,
      onLeave: onLastLeave,
    }

    const route4 = { url: '/', component: () => <div id="content">home</div> }

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <div>
          <RouteLink id="home" href="/">
            home
          </RouteLink>
          <RouteLink id="a" href="/route-a">
            a
          </RouteLink>
          <RouteLink id="b" href="/route-b">
            b
          </RouteLink>
          <RouteLink id="b-with-id" href="/route-b/123">
            b-with-id
          </RouteLink>
          <RouteLink id="c" href="/route-c">
            c
          </RouteLink>
          <RouteLink id="x" href="/route-x">
            x
          </RouteLink>
          <Router routes={[route1, route2, route3, route4]} notFound={<div id="content">not found</div>} />
        </div>
      ),
    })

    const getContent = () => document.getElementById('content')?.innerHTML
    const getLocation = () => location.pathname

    const clickOn = (name: string) => document.getElementById(name)?.click()

    await sleepAsync(100)

    expect(getLocation()).toBe('/')
    expect(getContent()).toBe('home')

    expect(onVisit).not.toBeCalled()

    clickOn('a')
    await sleepAsync(100)
    expect(getContent()).toBe('route-a')
    expect(getLocation()).toBe('/route-a')
    expect(onRouteChange).toBeCalledTimes(1)
    expect(onVisit).toBeCalledTimes(1)

    clickOn('a')
    await sleepAsync(100)
    expect(onVisit).toBeCalledTimes(1)
    expect(onLeave).not.toBeCalled()

    clickOn('b')
    await sleepAsync(100)
    expect(onLeave).toBeCalledTimes(1)

    expect(getContent()).toBe('route-b')
    expect(getLocation()).toBe('/route-b')

    clickOn('b-with-id')
    await sleepAsync(100)
    expect(getContent()).toBe('route-b123')
    expect(getLocation()).toBe('/route-b/123')

    clickOn('c')
    await sleepAsync(100)
    expect(getContent()).toBe('route-c')
    expect(getLocation()).toBe('/route-c')

    expect(onLastLeave).not.toBeCalled()
    clickOn('x')
    await sleepAsync(100)
    expect(getContent()).toBe('not found')
    expect(getLocation()).toBe('/route-x')
    expect(onLastLeave).toBeCalledTimes(1)
  })
})
