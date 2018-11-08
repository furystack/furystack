import { IContent } from "./IContent";
import { IEntity } from "./IEntity";
import { IFieldType } from "./IFieldType";
export interface IField extends IEntity {
    Value: string;
    Type: IFieldType;
    Content: IContent;
}
