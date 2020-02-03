import { Shade, createComponent } from '@furystack/shades'
import { TodoService } from '../services/todo-service'

export const AddTodo = Shade({
  shadowDomName: 'add-todo',
  initialState: { value: '' },
  render: ({ injector, updateState, getState, element }) => {
    setTimeout(() => {
      ;(element.querySelector('input') as any).focus()
    })
    return (
      <div>
        <style>{`::placeholder { color: #bbb; font-style: italic; } input:focus { outline: none;}`}</style>
        <input
          style={{
            padding: '16px',
            boxShadow: 'inset 0 -2px 1px rgba(0,0,0,0.03)',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.003)',
            fontSize: '24px',
          }}
          type="text"
          value={getState().value}
          placeholder="What needs to be done?"
          onkeyup={ev => {
            if (ev.key === 'Enter') {
              const todoService = injector.getInstance(TodoService)
              todoService.todos.setValue([
                ...todoService.todos.getValue(),
                { done: false, text: (ev.target as any).value },
              ])
              updateState({ value: '' })
            }
          }}
        />
      </div>
    )
  },
})
