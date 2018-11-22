import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Content } from "./Content";
import { IAspect } from "./IAspect";
import { IJob } from "./IJob";
import { IReferenceType } from "./IReferenceType";
import { IValueType } from "./IValueType";

@Entity()
export class ContentType<T = {}> {
    @PrimaryColumn()
    public Name!: string;

    @PrimaryColumn()
    public DisplayName?: string;

    @Column({nullable: true})
    public Description?: string;
    @Column({nullable: true})
    public Category?: string;
    @Column({nullable: true, type: "simple-json"})
    public Fields?: {
        [K: string]: IValueType | IReferenceType;
    };
    @Column({nullable: true, type: "simple-json"})
    public Aspects?: {
        [K: string]: IAspect<T>,
    };
    @Column({nullable: true, type: "simple-json"})
    public Jobs?: {
        [K: string]: IJob,
    };

    @OneToMany(() => Content, (c) => c.ContentTypeRef)
    public ContentInstances?: Content[];
}
