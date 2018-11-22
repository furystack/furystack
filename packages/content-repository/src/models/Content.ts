import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContentField } from "./ContentField";
import { ContentType } from "./ContentType";

@Entity()
export class Content {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column("simple-json")
    public Type!: ContentType;

    @ManyToOne(() => ContentType, (ct) => ct.ContentInstances)
    public ContentTypeRef!: ContentType;

    @OneToMany(() => ContentField, (cf) => cf.Content, {eager: true})
    public Fields!: ContentField[];
}
