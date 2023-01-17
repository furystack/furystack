import { StateManager } from './state-manager'
describe('StateManager', () => {
  it('Should return the state initial state', () => {
    const initialState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const stateManager = new StateManager(initialState)
    expect(stateManager.getState()).toEqual(initialState)
  })

  it('Should a field from initial state', () => {
    const initialState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const stateManager = new StateManager(initialState)
    expect(stateManager.getField('foo')).toEqual(initialState.foo)
    expect(stateManager.getField('bar')).toEqual(initialState.bar)
  })

  it('Should update the partial state', () => {
    const initialState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const stateManager = new StateManager(initialState)
    const stateUpdate = {
      foo: Math.random(),
    }
    const { oldState, newState } = stateManager.updateState(stateUpdate)
    expect(oldState).toEqual(initialState)
    expect(newState).toEqual({ ...initialState, ...stateUpdate })
  })

  it('Should update a field', () => {
    const initialState = {
      foo: Math.random(),
      bar: Math.random(),
    }
    const stateManager = new StateManager(initialState)
    const field = 'foo'
    const value = Math.random()
    const { oldState, newState } = stateManager.updateField(field, value)
    expect(oldState).toEqual(initialState)
    expect(newState).toEqual({ ...initialState, [field]: value })
  })
})
