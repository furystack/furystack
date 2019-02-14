import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'

/**
 * Represents a job type permission
 */
@Entity()
export class JobPermission {
  @PrimaryGeneratedColumn()
  public id!: number
  @ManyToOne(() => Content)
  public identity!: Content

  @ManyToOne(() => Content, c => c.jobPermissions)
  public content!: Content
  @Column({ type: 'varchar' })
  public type!: 'Read' | 'Write' | 'Complete' | 'Reject'
  @Column()
  public jobName!: string
}
