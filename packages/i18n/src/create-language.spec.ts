import { describe, expect, it } from 'vitest'
import { createLanguage } from './create-language.js'

describe('createLanguage', () => {
  it('Should return the same language', () => {
    const language = createLanguage({
      code: 'en',
      values: {
        hello: 'Hello',
        bye: 'Bye',
      },
    })
    expect(language.code).toBe('en')
    expect(language.values.hello).toBe('Hello')
    expect(language.values.bye).toBe('Bye')
  })
})
