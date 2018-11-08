import { IFieldType } from "./IFieldType";
import { IJobType } from "./IJobType";
import { INamedEntity } from "./INamedEntity";
import { IPermission } from "./IPermission";
import { IReferenceType } from "./IReferenceType";
import { IView } from "./IView";

/**
 * Represents a type definition for a generic content instance
 */
export interface IContentType extends INamedEntity {
    /**
     * A short description in HTML format
     */
    Description: string;
    /**
     * Category description. Can be used for grouping
     */
    Category: string;

    /**
     *  Default view when creating a content
     */
    CreateView: IView;

    /**
     * Default view when listing a type
     */
    ListView: IView;

    /**
     * Default view for opening the content details
     */
    DetailsView: IView;

    /**
     * Definition for field types. These fields will be created automatically for the content
     */
    FieldTypes: IFieldType[];
    /**
     * Definition for reference types. These references will be created automatically for the content
     */
    ReferenceTypes: IReferenceType[];
    /**
     * Definition for job types. These jobs will be created automatically for the content
     */
    JobTypes: IJobType[];
    /**
     * Assigned permissions for the content type
     */
    Permissions: IPermission[];
}
