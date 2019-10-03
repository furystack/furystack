import { Shade, createComponent } from '@furystack/shades'
import { TodoList } from '../components/todo-list'

export const TodoApp = Shade({
  shadowDomName: 'shade-app-todo-app',
  render: () => {
    return (
      <div>
        <TodoList />
      </div>
    )
  },
})
