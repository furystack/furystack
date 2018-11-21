
import { IContentType } from "@furystack/content";
import { Column, Entity, Index, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { Content } from "./Content";
import { FieldType } from "./FieldType";
import { JobType } from "./JobType";
import { Permission } from "./Permission";
import { ReferenceType } from "./ReferenceType";

@Entity()
@Index(["Name"], { unique: true })
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

    @OneToMany(() => Aspect, (a) => a.ContentType, { cascade: true })
    public Aspects!: Promise<Aspect[]>;

    @OneToMany(() => FieldType, (f) => f.ContentType, { cascade: true })
    public FieldTypes!: Promise<FieldType[]>;

    @OneToMany(() => ReferenceType, (r) => r.ContentType, { cascade: true })
    public ReferenceTypes!: Promise<ReferenceType[]>;

    @OneToMany(() => JobType, (r) => r.ContentType, { cascade: true })
    public JobTypes!: Promise<JobType[]>;

    @OneToMany(() => Permission, (p) => p.ContentType, { cascade: true })
    public Permissions!: Promise<Permission[]>;

    @ManyToMany(() => ReferenceType, (r) => r.AllowedTypes)
    public AllowedInReferenceTypes!: Promise<ReferenceType[]>;

}
