import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Represents a task model
 */
@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  // tslint:disable-next-line: naming-convention
  public _id!: string

  @Column()
  public userId!: string

  @Column()
  public name!: string
  @Column({ nullable: true })
  public description?: string

  @Column({ default: false })
  public completed!: boolean
}
