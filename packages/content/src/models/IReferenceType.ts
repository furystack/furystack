import { IContentType } from "./IContentType";
import { INamedEntity } from "./INamedEntity";

export interface IReferenceType extends INamedEntity {
    Description: string;
    ContentType: IContentType;
    AllowedTypes: IContentType[];
}
