import { IFieldType } from "@furystack/content";
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AspectField } from "./AspectField";
import { ContentType } from "./ContentType";

@Entity()
@Index(["ContentType", "Name"], { unique: true })
export class FieldType implements IFieldType {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({ nullable: true })
    public Description!: string;
    @Column({ nullable: true })
    public DefaultValue!: string;
    @Column({ default: false })
    public Unique!: boolean;
    @Column({ nullable: true })
    public Category!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: Promise<ContentType>;

    @OneToMany(() => AspectField, (f) => f.FieldType)
    public AspectFields!: Promise<AspectField[]>;
}
