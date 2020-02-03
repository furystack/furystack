import { ObservableValue } from '@furystack/utils'
import { Injectable } from '@furystack/inject'
import { TodoItem } from '../models/todo-item'

@Injectable({ lifetime: 'singleton' })
export class TodoService {
  public readonly todos = new ObservableValue<TodoItem[]>([])
}
