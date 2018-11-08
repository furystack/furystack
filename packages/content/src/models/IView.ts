import { IContentType } from "./IContentType";
import { IViewField } from "./IViewField";
import { IViewReference } from "./IViewReference";

export interface IView {
    Id: number;
    ContentType: IContentType;
    ViewFields: IViewField[];
    ViewReferences: IViewReference[];
}
