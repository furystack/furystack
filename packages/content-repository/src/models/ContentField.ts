import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Content } from './Content'

/**
 * Represents a Content Field
 */
@Entity()
export class ContentField {
  @PrimaryGeneratedColumn()
  public id!: number
  @ManyToOne(() => Content, c => c.fields)
  public content!: Content
  @Column()
  public name!: string
  @Column({ nullable: true })
  public value?: string
}
