import { Shade, createComponent } from '@furystack/shades'
import { TodoItem } from '../models/todo-item'
import { TodoService } from '../services/todo-service'
import { TodoItemComponent } from './todo-item'

export interface TodoState {
  todoItems: TodoItem[]
}

export const TodoList = Shade<{}, TodoState>({
  shadowDomName: 'todo-list',
  initialState: {
    todoItems: [],
  },
  construct: ({ injector, updateState }) => {
    const observers = [
      injector.getInstance(TodoService).todos.subscribe(todoItems => {
        updateState({ todoItems })
      }),
    ]

    return () => observers.map(o => o.dispose())
  },

  render: ({ getState }) => {
    const items = getState().todoItems
    return (
      <div>
        {items.map(todo => (
          <TodoItemComponent item={todo} />
        ))}
      </div>
    )
  },
})
