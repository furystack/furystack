import { Injector } from '@furystack/inject'
import { ContentDescriptorStore, User } from '../src'

describe('ContentDescriptor Store', () => {
  it('Should resolve a content type by name', () => {
    const cts = Injector.default.getInstance(ContentDescriptorStore)
    expect(cts.getByName('User')).toBe(User)
  })

  it('Should throw if a content type is not available', () => {
    const cts = Injector.default.getInstance(ContentDescriptorStore)
    expect(() => cts.getByName('SomeUndefinedContentType')).toThrowError(
      "Content type 'SomeUndefinedContentType' not found",
    )
  })
})
