import { IAspect } from "./IAspect";
import { IFieldType } from "./IFieldType";

export interface IAspectField {
    Id: number;
    FieldType: Promise<IFieldType>;
    Category: string;
    Order: number;
    ReadOnly: boolean;
    Required: boolean;
    ControlName: string;
    Aspect: Promise<IAspect>;
}
