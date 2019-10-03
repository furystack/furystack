import { Shade, createComponent } from '@furystack/shades'
import { TodoList } from '../components/todo-list'

export const TodoApp = Shade({
  shadowDomName: 'shade-app-todo-app',
  initialState: undefined,
  render: () => {
    return (
      <div>
        <TodoList />
      </div>
    )
  },
})
