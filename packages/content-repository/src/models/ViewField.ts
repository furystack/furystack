import { IViewField } from "@furystack/content";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FieldType } from "./FieldType";
import { View } from "./View";

@Entity()
export class ViewField implements IViewField {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @ManyToOne(() => FieldType, (f) => f.ViewFields)
    public FieldType!: FieldType;

    @Column()
    public Category!: string;

    @Column()
    public Order!: number;

    @Column()
    public ReadOnly!: boolean;

    @Column()
    public Required!: boolean;

    @Column()
    public ControlName!: string;

    @ManyToOne(() => View, (v) => v.ViewFields)
    public View!: View;
}
