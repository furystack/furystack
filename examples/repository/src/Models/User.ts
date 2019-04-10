import { IGoogleApiPayload } from '@furystack/auth-google'
import { IRole, IUser } from '@furystack/core'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Represents an user model
 */
@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  public id?: string
  @Column({ unique: true })
  public username!: string

  @Column('simple-json')
  public roles!: IRole[]
  @Column({
    transformer: {
      to: v => v,
      from: () => '- Encrypted value...:P -',
    },
  })
  public password!: string

  @Column({ nullable: true })
  public googleId?: number

  @Column('simple-json', { nullable: true })
  public googleProfileData?: IGoogleApiPayload
}
