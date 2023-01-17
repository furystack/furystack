import type { PartialElement } from '../models'

export class StateManager<TState> {
  /**
   *
   * @returns the current state of the manager
   */
  public getState(): TState {
    return this.state
  }

  public getField<TField extends keyof TState>(key: TField) {
    return this.state[key]
  }

  /**
   * @param stateUpdate The partial new state object
   * @returns an object with the old and the new state
   */
  public updateState(stateUpdate: PartialElement<TState>): { oldState: TState; newState: TState } {
    const oldState = { ...this.state }
    const newState = { ...this.state, ...stateUpdate }
    this.state = newState
    return { oldState, newState }
  }

  /**
   * @param field The field to update
   * @param value The new value of the field
   * @returns an object with the old and the new state
   */
  public updateField<TKey extends keyof TState>(
    field: TKey,
    value: TState[TKey],
  ): { oldState: TState; newState: TState } {
    const oldState = { ...this.state }
    const newState = { ...oldState, [field]: value }
    this.state = newState
    return { oldState, newState }
  }

  /**
   * @param key The field to update
   * @returns A tuple with a value and a value updater
   */
  public useState<TField extends keyof TState>(key: TField) {
    return [this.state[key], (value: TState[TField]) => this.updateField(key, value)] as const
  }

  constructor(private state: TState) {}
}
