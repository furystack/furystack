import { IAspect, IAspectField, IAspectReference } from "@furystack/content";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AspectField } from "./AspectField";
import { AspectReference } from "./AspectReference";
import { ContentType } from "./ContentType";

@Entity()
export class Aspect implements IAspect {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public Name!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: ContentType;

    @OneToMany(() => AspectField, (v) => v.Aspect)
    public AspectFields!: IAspectField[];

    @OneToMany(() => AspectReference, (v) => v.Aspect)
    public AspectReferences!: IAspectReference[];
}
