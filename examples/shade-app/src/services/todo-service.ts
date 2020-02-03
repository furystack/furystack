import { TodoItem } from '../models/todo-item'
import { ObservableValue } from '@furystack/utils'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class TodoService {
  public readonly todos = new ObservableValue<TodoItem[]>([])
}
