import { IEntity } from "./IEntity";
export interface INamedEntity extends IEntity {
    Name: string;
    DisplayName: string;
}
