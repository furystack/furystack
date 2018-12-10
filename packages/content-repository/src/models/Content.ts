import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ContentField } from "./ContentField";
import { ContentPermission } from "./ContentPermission";
import { ContentType } from "./ContentType";
import { JobPermission } from "./JobPermission";

export type ISavedContent<T> = T & Content;

@Entity()
export class Content {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @CreateDateColumn()
    public CreationDate!: Date;

    @UpdateDateColumn()
    public ModificationDate!: Date;

    @Column("simple-json")
    public Type!: ContentType;

    @ManyToOne(() => ContentType, (ct) => ct.ContentInstances)
    public ContentTypeRef!: ContentType;

    @OneToMany(() => ContentField, (cf) => cf.Content, {eager: true, cascade: true})
    public Fields!: ContentField[];

    @OneToMany(() => ContentPermission, (cp) => cp.Content, {eager: true, cascade: true} )
    public Permissions!: ContentPermission[];

    @OneToMany(() => JobPermission, (jp) => jp.Content, {eager: true, cascade: true})
    public JobPermissions!: JobPermission[];
}
