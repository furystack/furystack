import { IRole } from '@furystack/core'
import { ContentType } from '../Decorators/ContentType'
import { Field } from '../Decorators/Field'

/**
 * Representation of an user role
 */
@ContentType<Role>({
  displayName: 'Role',
  description: 'Role for a specified user',
  aspects: {
    Create: {
      fields: [{ fieldName: 'name', required: true }],
    },
    Edit: {
      fields: [{ fieldName: 'name', required: true }],
    },
    Modify: {
      fields: [{ fieldName: 'name', readOnly: true }],
    },
    List: {
      fields: [{ fieldName: 'name', readOnly: true }],
    },
    Expanded: {
      fields: [{ fieldName: 'displayName' }],
    },
    Details: {
      fields: [
        { fieldName: 'name', readOnly: true },
        { fieldName: 'displayName', readOnly: true },
        { fieldName: 'description', readOnly: true },
      ],
    },
  },
})
export class Role implements IRole {
  @Field()
  public description?: string

  @Field({
    unique: true,
  })
  public name!: string
  @Field()
  public displayName!: string
}
