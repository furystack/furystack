import { Injector } from '@furystack/inject'
import { ContentDescriptorStore } from '../src'
import { ContentType } from '../src/Decorators/ContentType'
import { Field } from '../src/Decorators/Field'
import { Reference } from '../src/Decorators/Reference'
describe('@ContentType() decorator', () => {
  it('Should', () => {
    const injector = new Injector({ owner: 'ContentTypeDecoratorTests', parent: undefined })
    injector.setInstance(new ContentDescriptorStore())
    @ContentType({ displayName: 'My Test Class', injector })
    class TestClass {
      @Field({ displayName: 'User Name Display Name', injector })
      public username!: string

      @Reference({ displayName: 'Referenceke', injector })
      public valami!: object
    }

    const value = injector.getInstance(ContentDescriptorStore).contentTypeDescriptors.get(TestClass)
    expect(value).toBeTruthy()
    expect(value && value.fields).toBeTruthy()
    if (value && value.fields) {
      expect(value.displayName).toEqual('My Test Class')
      expect(value.fields.username.displayName).toEqual('User Name Display Name')
      expect(value.fields.valami.displayName).toEqual('Referenceke')
    }
  })
})
