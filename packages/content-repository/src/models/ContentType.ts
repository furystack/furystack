
import { IContentType } from "@furystack/content";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";
import { FieldType } from "./FieldType";
import { JobType } from "./JobType";
import { Permission } from "./Permission";
import { ReferenceType } from "./ReferenceType";
import { View } from "./View";

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

    @ManyToOne(() => View)
    public CreateView!: View;

    @ManyToOne(() => View)
    public ListView!: View;

    @ManyToOne(() => View)
    public DetailsView!: View;

    @OneToMany(() => FieldType, (f) => f.ContentType)
    public FieldTypes!: FieldType[];

    @OneToMany(() => ReferenceType, (r) => r.ContentType)
    public ReferenceTypes!: ReferenceType[];

    @OneToMany(() => JobType, (r) => r.ContentType)
    public JobTypes!: JobType[];

    @OneToMany(() => Permission, (p) => p.ContentType)
    public Permissions!: Permission[];

}
