
import { IContentType } from "@furystack/content";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { Content } from "./Content";
import { FieldType } from "./FieldType";
import { JobType } from "./JobType";
import { Permission } from "./Permission";
import { ReferenceType } from "./ReferenceType";

@Entity()
export class ContentType implements IContentType {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column({
        unique: true,
    })
    public Name!: string;

    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({
        nullable: true,
    })
    public Description!: string;
    @Column({
        nullable: true,
    })
    public Category!: string;
    @OneToMany(() => Content, (c) => c.Type)
    public Content!: Content[];

    @OneToMany(() => Aspect, (a) => a.ContentType)
    public Aspects!: Aspect[];

    @OneToMany(() => FieldType, (f) => f.ContentType)
    public FieldTypes!: FieldType[];

    @OneToMany(() => ReferenceType, (r) => r.ContentType)
    public ReferenceTypes!: ReferenceType[];

    @OneToMany(() => JobType, (r) => r.ContentType)
    public JobTypes!: JobType[];

    @OneToMany(() => Permission, (p) => p.ContentType)
    public Permissions!: Permission[];

}
