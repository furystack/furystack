import { IJob } from "@furystack/content";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { Content } from "./Content";
import { Permission } from "./Permission";

@Entity()
export class Job implements IJob {
    @PrimaryGeneratedColumn()
    public Id!: number;

    @Column()
    public Name!: string;
    @Column({ nullable: true })
    public DisplayName!: string;

    @Column({ nullable: true })
    public Description!: string;

    @Column()
    public Completed!: boolean;

    @ManyToOne(() => Content, (c) => c.Jobs)
    public Content!: Content;

    @ManyToMany(() => Job)
    @JoinTable()
    public Prerequisites!: Job[];

    @OneToOne(() => Aspect)
    public Aspect!: Aspect;

    @OneToMany(() => Permission, (p) => p.Job)
    public Permissions!: Permission[];
}
