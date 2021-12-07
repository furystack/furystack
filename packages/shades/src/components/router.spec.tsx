import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { Injector } from '@furystack/inject'
import { Router } from './router'
import { JSDOM } from 'jsdom'
import { createComponent, initializeShadeRoot, LocationService } from '..'
import { RouteLink } from '.'

describe('Router', () => {
  const oldDoc = document

  beforeAll(() => {
    globalThis.document = new JSDOM().window.document
    window.matchMedia = () => ({ matches: true } as any)
  })

  afterAll(() => {
    globalThis.document = oldDoc
  })

  beforeEach(() => (document.body.innerHTML = '<div id="root"></div>'))
  afterEach(() => (document.body.innerHTML = ''))

  it('Shuld display the loader and completed state', async () => {
    history.pushState(null, '/')

    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    const onRouteChange = jest.fn()

    injector.getInstance(LocationService).onLocationChanged.subscribe(onRouteChange)

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
          <RouteLink id="c" href="/route-c">
            c
          </RouteLink>
          <RouteLink id="x" href="/route-x">
            x
          </RouteLink>
          <Router
            routes={[
              { url: '/route-a', component: () => <div id="content">route-a</div> },
              { url: '/route-b', component: () => <div id="content">route-b</div> },
              { url: '/route-c', component: () => <div id="content">route-c</div> },
              { url: '/', component: () => <div id="content">home</div> },
            ]}
            notFound={() => <div id="content">not found</div>}
          />
        </div>
      ),
    })

    const getContent = () => document.getElementById('content')?.innerHTML
    const getLocation = () => location.pathname

    const clickOn = (name: string) => document.getElementById(name)?.click()

    expect(getLocation()).toBe('/')
    expect(getContent()).toBe('home')

    clickOn('a')
    expect(getContent()).toBe('route-a')
    expect(getLocation()).toBe('/route-a')
    expect(onRouteChange).toBeCalledTimes(2)

    clickOn('b')
    expect(getContent()).toBe('route-b')
    expect(getLocation()).toBe('/route-b')

    clickOn('c')
    expect(getContent()).toBe('route-c')
    expect(getLocation()).toBe('/route-c')

    clickOn('x')
    expect(getContent()).toBe('not found')
    expect(getLocation()).toBe('/route-x')
  })
})
