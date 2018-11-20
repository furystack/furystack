import { IReferenceType } from "@furystack/content";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ContentType } from "./ContentType";

@Entity()
export class ReferenceType implements IReferenceType {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @Column()
    public Name!: string;
    @Column({ nullable: true })
    public DisplayName!: string;
    @Column({ nullable: true })
    public Description!: string;
    @Column({ nullable: true })
    public Category!: string;

    @ManyToOne(() => ContentType)
    public ContentType!: Promise<ContentType>;

    @ManyToMany(() => ContentType)
    @JoinTable()
    public AllowedTypes!: Promise<ContentType[]>;

    @Column({ default: false })
    public AllowMultiple!: boolean;
}
