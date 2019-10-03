import { Shade, createComponent } from '@furystack/shades'
import { TodoItem } from '../models/todo-item'
import { TodoService } from '../services/todo-service'
import { TodoItemComponent } from './todo-item'
import { AddTodo } from './add-todo'

export interface TodoState {
  allDone: boolean
  todoItems: TodoItem[]
}

export const TodoList = Shade<{}, TodoState>({
  shadowDomName: 'todo-list',
  initialState: {
    allDone: false,
    todoItems: [],
  },
  construct: ({ injector, updateState }) => {
    const observers = [
      injector.getInstance(TodoService).todos.subscribe(todoItems => {
        const allDone = todoItems.find(t => !t.done) === undefined
        updateState({ todoItems, allDone })
      }),
    ]

    return () => observers.map(o => o.dispose())
  },

  render: ({ getState, injector }) => {
    const items = getState().todoItems
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
              style={{
                transform: 'rotate(90deg)',
                marginRight: '18px',
                transition: 'opacity 1s ease-in-out 1s',
                opacity: getState().allDone ? '1' : '0.5',
                cursor: 'pointer',
              }}
              onclick={() => {
                const state = getState()
                const todoService = injector.getInstance(TodoService)
                todoService.todos.setValue(
                  todoService.todos.getValue().map(t => ({ ...t, done: state.allDone ? false : true })),
                )
              }}>
              ❯
            </span>
            <AddTodo />
          </div>
          {items.map(todo => (
            <TodoItemComponent item={todo} />
          ))}
        </div>
      </div>
    )
  },
})
