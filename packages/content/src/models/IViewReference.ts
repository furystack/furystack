import { IReference } from "./IReference";
import { IView } from "./IView";

export interface IViewReference {
    Id: number;
    Reference: IReference;
    Order: number;
    Category: string;
    ReadOnly: boolean;
    ControlName: string;
    View: IView;
}
