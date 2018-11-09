import { IRole } from "@furystack/core";
import { ContentType } from "../Decorators/ContentType";
import { Field } from "../Decorators/Field";

@ContentType({
    DisplayName: "Role",
    Description: "Role for a specified user",
})
export class Role implements IRole {
    @Field()
    public Description?: string;

    @Field({ Unique: true })
    public Name!: string;
    @Field()
    public DisplayName!: string;
}
