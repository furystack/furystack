import { IAspect } from "./IAspect";
import { IContentType } from "./IContentType";
import { INamedEntity } from "./INamedEntity";
import { IPermission } from "./IPermission";

export interface IJobType extends INamedEntity {
    Name: string;
    DisplayName: string;
    Description: string;
    ContentType: Promise<IContentType>;
    Prerequisites: Promise<IJobType[]>;
    Aspect: Promise<IAspect>;
    Permissions: Promise<IPermission[]>;
}
