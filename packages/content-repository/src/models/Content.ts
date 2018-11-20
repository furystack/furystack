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
    public Type!: Promise<ContentType>;

    @OneToMany(() => Field, (f) => f.Content)
    public Fields!: Promise<Field[]>;

    @OneToMany(() => Job, (j) => j.Content)
    public Jobs!: Promise<Job[]>;

    @OneToMany(() => Reference, (r) => r.Content)
    public References!: Promise<Reference[]>;

    @OneToMany(() => Permission, (p) => p.Content)
    public Permissions!: Promise<Permission[]>;
}
