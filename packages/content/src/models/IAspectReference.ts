import { IAspect } from "./IAspect";
import { IReferenceType } from "./IReferenceType";

export interface IAspectReference {
    Id: number;
    ReferenceType: Promise<IReferenceType>;
    Order: number;
    Category: string;
    ReadOnly: boolean;
    ControlName: string;
    Aspect: Promise<IAspect>;
}
