import { IRole } from "@furystack/core";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";

@ContentType<Role>({
    DisplayName: "Role",
    Description: "Role for a specified user",
    Aspects: {
        Create: {
            Fields:
                [
                    { FieldName: "Name", Required: true },
                ],
        },
        Modify: {
            Fields: [
                { FieldName: "Name", ReadOnly: true },
            ],
        },
        List: {
            Fields: [
                { FieldName: "Name", ReadOnly: true },
            ],
        },
        Expanded: {
            Fields: [
                {FieldName: "DisplayName"},
            ],
        },
        Details: {
            Fields: [
                {FieldName: "Name", ReadOnly: true},
                {FieldName: "DisplayName", ReadOnly: true},
                {FieldName: "Description", ReadOnly: true},
            ],
        },
    },
})
export class Role implements IRole {
    @Field()
    public Description?: string;

    @Field({
        Unique: true,
    })
    public Name!: string;
    @Field()
    public DisplayName!: string;
}
