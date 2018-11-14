import { IAspectField } from "./IAspectField";
import { IContentType } from "./IContentType";
import { INamedEntity } from "./INamedEntity";

export interface IFieldType extends INamedEntity {
    Description: string;
    DefaultValue: string;
    Unique: boolean;
    Category: string;
    ContentType: IContentType;
    AspectFields: IAspectField[];
}
