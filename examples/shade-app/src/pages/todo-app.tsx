import { Injector } from '@furystack/inject'
import { Shade, createComponent } from '@furystack/shades'
import { TodoService } from '../services/todo-service'
import { AddTodo } from '../components/add-todo'
import { TodoList } from '../components/todo-list'

export const TodoApp = Shade({
  initialState: {
    getAllDone: (injector: Injector) => {
      const items = injector.getInstance(TodoService).todos.getValue()
      return items.find(i => i.done === false) === undefined
    },
  },
  shadowDomName: 'shade-app-todo-app',
  constructed: ({ injector, getState, element }) => {
    const observers = [
      injector.getInstance(TodoService).todos.subscribe(() => {
        const allDone = getState().getAllDone(injector)
        const el = element.querySelector<HTMLSpanElement>('.select-all-todos')
        el && el.style && (el.style.opacity = allDone ? '1' : '0.3')
      }),
    ]

    return () => observers.map(o => o.dispose())
  },
  render: ({ getState, injector }) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <h1
          style={{
            margin: '0px',
            fontSize: '100px',
            color: 'rgba(175, 47, 47, 0.15)',
          }}>
          todos
        </h1>
        <div
          style={{
            background: 'white',
            boxShadow: '1px 1px 3px rgba(0,0,0,.2)',
          }}>
          <div style={{ display: 'flex' }}>
            <span
              className="select-all-todos"
              style={{
                transform: 'rotate(90deg)',
                marginRight: '18px',
                transition: 'opacity .5s ease-in-out',
                opacity: getState().getAllDone(injector) ? '1' : '0.3',
                cursor: 'pointer',
              }}
              onclick={() => {
                const todoService = injector.getInstance(TodoService)
                todoService.todos.setValue(
                  todoService.todos
                    .getValue()
                    .map(t => ({ ...t, done: getState().getAllDone(injector) ? false : true })),
                )
              }}>
              ❯
            </span>
            <AddTodo />
          </div>
          <TodoList />
        </div>
      </div>
    )
  },
})
