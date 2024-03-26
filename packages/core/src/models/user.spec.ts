import { describe, expect, it } from 'vitest'
import { User } from './user.js'

describe('User', () => {
  it('Should be constructed', () => {
    const user = new User()
    expect(user).toBeInstanceOf(User)
  })
})
