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
    injector.getInstance(TodoService).todos.subscribe(todoItems => updateState({ todoItems }))
  },

  render: ({ getState }) => {
    const items = getState().todoItems
    return (
      <div>
        <AddTodo />
        <hr />
        {items.map(todo => (
          <TodoItemComponent item={todo} />
        ))}
      </div>
    )
  },
})
