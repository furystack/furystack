import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Content } from "./Content";

@Entity()
export class ContentField {
    @PrimaryGeneratedColumn()
    public Id!: number;
    @ManyToOne(() => Content, (c) => c.Fields)
    public Content!: Content;
    @Column()
    public Name!: string;
    @Column({nullable: true})
    public Value?: string;
}
