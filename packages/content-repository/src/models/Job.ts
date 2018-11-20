import { IJob } from "@furystack/content";
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Aspect } from "./Aspect";
import { Content } from "./Content";
import { Permission } from "./Permission";

@Entity()
@Index(["Name", "Content"], { unique: true })
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
    public Content!: Promise<Content>;

    @ManyToMany(() => Job)
    @JoinTable()
    public Prerequisites!: Promise<Job[]>;

    @OneToOne(() => Aspect)
    public Aspect!: Promise<Aspect>;

    @OneToMany(() => Permission, (p) => p.Job)
    public Permissions!: Promise<Permission[]>;
}
