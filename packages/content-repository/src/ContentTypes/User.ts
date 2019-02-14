import { ContentType } from '../Decorators/ContentType'
import { Field } from '../Decorators/Field'
import { Reference } from '../Decorators/Reference'
import { Role } from './Role'

/**
 * Represents an application user
 */
@ContentType<User>({
  displayName: 'User',
  description: 'Represents an User content',
  category: 'System',
  aspects: {
    Create: {
      fields: [
        { fieldName: 'username', required: true, controlHint: 'UserName' },
        { fieldName: 'password', required: true, controlHint: 'Password' },
      ],
    },
    Edit: {
      fields: [
        { fieldName: 'username', required: true, controlHint: 'UserName' },
        { fieldName: 'password', required: true, controlHint: 'Password' },
      ],
    },
    List: {
      fields: [{ fieldName: 'username', readOnly: true }],
    },
    Expanded: {
      fields: [{ fieldName: 'username' }],
    },
    Details: {
      fields: [{ fieldName: 'username', readOnly: true, required: true }, { fieldName: 'roles', readOnly: true }],
    },
  },
})
export class User {
  @Field({
    description: 'The unique name for the user',
    displayName: 'User Name',
    unique: true,
  })
  public username!: string
  @Reference({
    allowedTypeNames: ['Role'],
    allowMultiple: true,
  })
  public roles!: Role[]

  @Field()
  public password!: string
}
