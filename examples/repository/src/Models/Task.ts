import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Represents a task model
 */
@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  public id?: string

  @Column()
  public userId!: string

  @Column()
  public name!: string
  @Column({ nullable: true })
  public description?: string

  @Column({ default: false })
  public completed!: boolean
}
