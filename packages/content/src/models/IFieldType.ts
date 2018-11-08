import { IContentType } from "./IContentType";
import { IEntity } from "./IEntity";
import { INamedEntity } from "./INamedEntity";
import { IViewField } from "./IViewField";

export interface IFieldType extends INamedEntity {
    Description: string;
    DefaultValue: string;
    ContentType: IContentType;
    ViewFields: IViewField[];
}
