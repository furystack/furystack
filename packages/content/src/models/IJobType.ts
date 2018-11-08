import { IContentType } from "./IContentType";
import { INamedEntity } from "./INamedEntity";
import { IPermission } from "./IPermission";
import { IView } from "./IView";

export interface IJobType extends INamedEntity {
    Name: string;
    DisplayName: string;
    Description: string;
    ContentType: IContentType;
    Prerequisites: IJobType[];
    View: IView;
    Permissions: IPermission[];
}
