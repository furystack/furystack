import { createComponent, Router, LazyLoad, Shade } from '@furystack/shades'
import { HomePage } from '../pages/home'

export const Body = Shade({
  shadowDomName: 'shade-app-body',
  render: () => {
    return (
      <div
        id="Body"
        style={{
          margin: '10px',
          padding: '10px',
          width: 'calc(100% - 40px)',
          height: '100%',
          overflow: 'hidden',
        }}>
        <Router
          routeMatcher={(current, component) => current.pathname === component}
          routes={[
            { url: '/', component: () => <HomePage /> },
            {
              url: '/todo-app',
              component: () => (
                <LazyLoad
                  loader={<div>loading...</div>}
                  component={async () => {
                    const Todo = (await import(/* webpackChunkName: "todo-app" */ '../pages/todo-app')).TodoApp
                    return <Todo />
                  }}
                />
              ),
            },
            {
              url: '/lazy-load',
              component: () => (
                <LazyLoad
                  loader={<div>loading...</div>}
                  component={async () => {
                    const LLD = (await import(/* webpackChunkName: "lazy-load" */ '../pages/lazy-load')).LazyLoadDemo
                    return <LLD />
                  }}
                />
              ),
            },
            {
              url: '/counter-demo',
              component: () => (
                <LazyLoad
                  loader={<div>loading...</div>}
                  component={async () => {
                    const CD = (await import(/* webpackChunkName: "counter-demo" */ '../pages/counter-demo'))
                      .CounterDemo
                    return <CD />
                  }}
                />
              ),
            },
          ]}
        />
      </div>
    )
  },
})
