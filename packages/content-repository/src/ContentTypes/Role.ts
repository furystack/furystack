import { IRole } from "@furystack/core";

export class Role implements IRole {
    public Description?: string;
    public Name: string;
    public DisplayName: string;
}
