import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'
import { ContentType } from './ContentType'

/**
 * Represents a job type permission
 */
@Entity()
export class JobTypePermission {
  @PrimaryGeneratedColumn()
  public id!: number
  @ManyToOne(() => Content)
  public identity!: Content

  @ManyToOne(() => ContentType, c => c.jobTypePermissions)
  public contentType!: ContentType
  @Column({ type: 'varchar' })
  public type!: 'Read' | 'Write' | 'Complete' | 'Reject'
  @Column()
  public jobName!: string
}
