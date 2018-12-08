import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";
import { Reference } from "../Decorators/Reference";
import { Role } from "./Role";

@ContentType<User>({
    DisplayName: "User",
    Description: "Represents an User content",
    Category: "System",
    Aspects: {
        Create: {
            Fields: [
                { FieldName: "Username", Required: true, ControlHint: "UserName" },
                { FieldName: "Password", Required: true, ControlHint: "Password" },
            ],
        },
        List: {
            Fields: [
                { FieldName: "Username", ReadOnly: true },
            ],
        },
        Expanded: {
            Fields: [
                {FieldName: "Username"},
            ],
        },
        Details: {
            Fields: [
                {FieldName: "Username", ReadOnly: true},
                {FieldName: "Roles", ReadOnly: true},
                {FieldName: "Password", ReadOnly: true},

            ],
        },
    },
})
export class User {
    @Field({
        Description: "The unique name for the user",
        DefaultValue: "assd",
        DisplayName: "User Name",
        Unique: true,
    })
    public Username!: string;
    @Reference({
        AllowedTypeNames: ["Role"],
        AllowMultiple: true,
    })
    public Roles!: Role[];

    @Field()
    public Password!: string;
}
