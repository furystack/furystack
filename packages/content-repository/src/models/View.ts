import { IView } from "@furystack/content";
import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";
import { ViewField } from "./ViewField";
import { ViewReference } from "./ViewReference";

@Entity()
export class View implements IView {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => ContentType)
    public ContentType!: ContentType;

    @OneToMany(() => ViewField, (v) => v.View)
    public ViewFields!: ViewField[];

    @OneToMany(() => ViewReference, (v) => v.View)
    public ViewReferences!: ViewReference[];
}
