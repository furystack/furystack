import { Shade, createComponent } from '@furystack/shades'
import { TodoService } from '../services/todo-service'

export const AddTodo = Shade({
  shadowDomName: 'add-todo',
  initialState: { value: '' },
  render: ({ injector, updateState, getState }) => {
    return (
      <div>
        <form
          onsubmit={(ev: Event) => {
            ev.preventDefault()
            const todoService = injector.getInstance(TodoService)
            todoService.todos.setValue([...todoService.todos.getValue(), { done: false, text: getState().value }])
            updateState({ value: '' })
          }}>
          <input
            type="text"
            value={getState().value}
            placeholder="New TodoItem name"
            onchange={(ev: InputEvent) =>
              updateState({ value: (ev.target && (ev.target as HTMLInputElement).value) || '' })
            }
          />
          <input type="submit" value="add" />
        </form>
      </div>
    )
  },
})
