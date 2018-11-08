import { IContent } from "@furystack/content";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";
import { Field } from "./Field";
import { Job } from "./Job";
import { Permission } from "./Permission";
import { Reference } from "./Reference";

@Entity()
export class Content implements IContent {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => ContentType, (ct) => ct.Content)
    public Type!: ContentType;

    @OneToMany(() => Field, (f) => f.Content)
    public Fields!: Field[];

    @OneToMany(() => Job, (j) => j.Content)
    public Jobs!: Job[];

    @OneToMany(() => Reference, (r) => r.Content)
    public References!: Reference[];

    @OneToMany(() => Permission, (p) => p.Content)
    public Permissions!: Permission[];
}
