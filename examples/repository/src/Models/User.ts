import { IRole, IUser } from '@furystack/core'
import { ILoginUser } from '@furystack/http-api'
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/**
 * Represents an user model
 */
@Entity()
export class User implements ILoginUser<IUser> {
  @PrimaryGeneratedColumn()
  public id?: number
  @Column()
  public username!: string

  @Column('simple-json')
  public roles!: IRole[]
  @Column()
  public password!: string
}
