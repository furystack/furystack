import { Shade, createComponent } from '@furystack/shades'
import { TodoItem } from '../models/todo-item'
import { TodoService } from '../services/todo-service'

export const TodoItemComponent = Shade<{ item: TodoItem }>({
  shadowDomName: 'todo-item',
  render: ({ props, injector }) => {
    const todoService = injector.getInstance(TodoService)
    return (
      <div
        className="todo-container"
        style={{
          display: 'flex',
          alignItems: 'space-between',
        }}>
        <style>{`
      .todo-container .remove-todo {
        display: none !important;
      }
      
      .todo-container:hover .remove-todo {
        display: flex !important;
      }
      `}</style>

        <div style={{ flexGrow: '1', display: 'flex', alignItems: 'center' }}>
          <input
            style={{
              height: '40px',
              borderRadius: '50%',
            }}
            checked={props.item.done}
            type="checkbox"
            onchange={() => {
              props.item.done = !props.item.done
              todoService.todos.setValue([...todoService.todos.getValue()])
            }}
          />
          <label
            style={{
              textDecoration: props.item.done ? 'line-through' : 'none',
            }}>
            {props.item.text}
          </label>
        </div>
        <div
          className="remove-todo"
          style={{
            display: 'inherits',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(192,0,0,1)',
            minWidth: '48px',
            cursor: 'pointer',
            fontSize: '24px',
          }}
          onclick={() => {
            todoService.todos.setValue(todoService.todos.getValue().filter(v => v !== props.item))
          }}>
          ×
        </div>
      </div>
    )
  },
})
