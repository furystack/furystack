import { IContent } from "./IContent";
import { IEntity } from "./IEntity";
import { INamedEntity } from "./INamedEntity";
import { IPermission } from "./IPermission";
import { IView } from "./IView";

export interface IJob extends INamedEntity {
    Description: string;
    Completed: boolean;
    Content: IContent;
    Prerequisites: IJob[];
    View: IView;
    Permissions: IPermission[];
}
