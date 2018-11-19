import { IContentType } from "./IContentType";
import { INamedEntity } from "./INamedEntity";

export interface IReferenceType extends INamedEntity {
    Description: string;
    Category: string;
    ContentType: Promise<IContentType>;
    AllowedTypes: Promise<IContentType[]>;
}
