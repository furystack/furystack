import { IAspectField } from "./IAspectField";
import { IAspectReference } from "./IAspectReference";
import { IContentType } from "./IContentType";

export interface IAspect {
    Id: number;
    Name: string;
    ContentType: IContentType;
    AspectFields: IAspectField[];
    AspectReferences: IAspectReference[];
}
