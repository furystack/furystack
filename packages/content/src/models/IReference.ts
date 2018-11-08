import { IContent } from "./IContent";
import { IEntity } from "./IEntity";
import { IReferenceType } from "./IReferenceType";

export interface IReference extends IEntity {
    Type: IReferenceType;
    Content: IContent;
    References: IContent[];
}
