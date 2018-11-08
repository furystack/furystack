import { INamedEntity } from "./INamedEntity";

export interface IPermissionType extends INamedEntity {
    Description: string;
    Category: string;
}
