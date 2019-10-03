import { Shade, createComponent } from '@furystack/shades'
import { TodoItem } from '../models/todo-item'
import { TodoService } from '../services/todo-service'

export const TodoItemComponent = Shade<{ item: TodoItem }, undefined>({
  shadowDomName: 'todo-item',
  initialState: undefined,
  render: ({ props, injector }) => {
    const todoService = injector.getInstance(TodoService)
    return (
      <div>
        <input
          checked={props.item.done}
          type="checkbox"
          onchange={() => {
            props.item.done = !props.item.done
          }}
        />
        {props.item.text}
        <button
          onclick={() => {
            todoService.todos.setValue(todoService.todos.getValue().filter(v => v !== props.item))
          }}>
          🚮
        </button>
      </div>
    )
  },
})
