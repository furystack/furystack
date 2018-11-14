import { IAspect } from "./IAspect";
import { IReference } from "./IReference";

export interface IAspectReference {
    Id: number;
    Reference: IReference;
    Order: number;
    Category: string;
    ReadOnly: boolean;
    ControlName: string;
    Aspect: IAspect;
}
