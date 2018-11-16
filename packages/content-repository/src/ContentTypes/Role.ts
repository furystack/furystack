import { IRole } from "@furystack/core";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";

@ContentType({
    DisplayName: "Role",
    Description: "Role for a specified user",
})
export class Role implements IRole {
    @Field({
        Aspects: {
            Create: {
                ReadOnly: false,
            },
        },
    })
    public Description?: string;

    @Field({
        Unique: true,
        Aspects: {
            Create: {
                Required: true,
                ReadOnly: false,
            },
        },
    })
    public Name!: string;
    @Field({
        Aspects: {
            Create: {
                ReadOnly: false,
            },
        },
    })
    public DisplayName!: string;
}
