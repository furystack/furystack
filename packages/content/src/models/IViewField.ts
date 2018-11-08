import { IFieldType } from "./IFieldType";
import { IView } from "./IView";

export interface IViewField {
    Id: number;
    FieldType: IFieldType;
    Category: string;
    Order: number;
    ReadOnly: boolean;
    Required: boolean;
    ControlName: string;
    View: IView;
}
