import { GoogleApiPayload } from '@furystack/auth-google'
import { Role, User as FsUser } from '@furystack/core'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Represents an user model
 */
@Entity()
export class User implements FsUser {
  @PrimaryGeneratedColumn('uuid')
  // tslint:disable-next-line: naming-convention
  public _id!: string
  @Column({ unique: true })
  public username!: string

  @Column('simple-json')
  public roles!: Role[]
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
  public googleProfileData?: GoogleApiPayload
}
