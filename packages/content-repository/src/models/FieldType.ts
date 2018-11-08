import { IFieldType } from "@furystack/content";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";
import { ViewField } from "./ViewField";

@Entity()
export class FieldType implements IFieldType {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({ nullable: true })
    public Description!: string;
    @Column()
    public DefaultValue!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: ContentType;

    @OneToMany(() => ViewField, (f) => f.FieldType)
    public ViewFields!: ViewField[];
}
