import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ContentField } from "./ContentField";
import { ContentType } from "./ContentType";

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

    @OneToMany(() => ContentField, (cf) => cf.Content, {eager: true})
    public Fields!: ContentField[];
}
