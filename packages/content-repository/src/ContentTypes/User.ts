import { IRole } from "@furystack/content";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";
import { Reference } from "../Decorators/Reference";

@ContentType<User>({
    DisplayName: "User",
    Description: "Represents an User content",
    Category: "System",
    Aspects: {
        Create: {
            Fields: [
                {FieldName: "Username", Required: true, ControlHint: "UserName"},
                {FieldName: "Password", Required: true, ControlHint: "Password"},
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
    })
    public Roles!: IRole[];

    @Field()
    public Password!: string;
}
