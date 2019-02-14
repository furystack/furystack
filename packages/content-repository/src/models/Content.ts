import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ContentField } from './ContentField'
import { ContentPermission } from './ContentPermission'
import { ContentType } from './ContentType'
import { JobPermission } from './JobPermission'

/**
 * Represents a saved content instance
 */
export type ISavedContent<T> = T & Content

/**
 * Represents a Content instance
 */
@Entity()
export class Content {
  @PrimaryGeneratedColumn()
  public id!: number

  @CreateDateColumn()
  public creationDate!: Date

  @UpdateDateColumn()
  public modificationDate!: Date

  @Column('simple-json')
  public type!: ContentType

  @ManyToOne(() => ContentType, ct => ct.contentInstances, { eager: true })
  public contentTypeRef!: ContentType

  @OneToMany(() => ContentField, cf => cf.content, { eager: true, cascade: true })
  public fields!: ContentField[]

  @OneToMany(() => ContentPermission, cp => cp.content, { eager: true, cascade: true })
  public permissions!: ContentPermission[]

  @OneToMany(() => JobPermission, jp => jp.content, { eager: true, cascade: true })
  public jobPermissions!: JobPermission[]
}
