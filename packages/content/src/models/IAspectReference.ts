import { IAspect } from "./IAspect";
import { IReferenceType } from "./IReferenceType";

export interface IAspectReference {
    Id: number;
    ReferenceType: IReferenceType;
    Order: number;
    Category: string;
    ReadOnly: boolean;
    ControlName: string;
    Aspect: IAspect;
}
