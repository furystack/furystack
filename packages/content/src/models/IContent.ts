import { IContentType } from "./IContentType";
import { IEntity } from "./IEntity";
import { IField } from "./IField";
import { IJob } from "./IJob";
import { IPermission } from "./IPermission";
import { IReference } from "./IReference";

/**
 * Model that represents a generic content instance
 */
export interface IContent extends IEntity {
    /**
     * Reference to the type of the content
     */
    Type: Promise<IContentType>;

    /**
     * List of the content's fields
     */
    Fields: Promise<IField[]>;

    /**
     * List of the content's jobs
     */
    Jobs: Promise<IJob[]>;

    /**
     * List of the content's references
     */
    References: Promise<IReference[]>;

    /**
     * List of the content's permissions
     */
    Permissions: Promise<IPermission[]>;
}
