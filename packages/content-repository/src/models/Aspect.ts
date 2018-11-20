import { IAspect } from "@furystack/content";
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AspectField } from "./AspectField";
import { AspectReference } from "./AspectReference";
import { ContentType } from "./ContentType";

@Entity()
@Index(["ContentType", "Name"], { unique: true })
export class Aspect implements IAspect {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public Name!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: Promise<ContentType>;

    @OneToMany(() => AspectField, (v) => v.Aspect)
    public AspectFields!: Promise<AspectField[]>;

    @OneToMany(() => AspectReference, (v) => v.Aspect)
    public AspectReferences!: Promise<AspectReference[]>;
}
