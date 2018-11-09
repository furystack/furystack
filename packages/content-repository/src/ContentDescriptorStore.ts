import { IContentType } from "@furystack/content";
import { Constructable, Injectable } from "@furystack/inject";
import { IContentTypeDecoratorOptions } from "./Decorators/ContentType";
import { IFieldTypeDecoratorOptions } from "./Decorators/Field";

@Injectable()
export class ContentDescriptorStore {

    public readonly ContentTypeDescriptors: Map<Constructable<any>, IContentTypeDecoratorOptions> = new Map();
    public readonly ContentTypes: Map<string, IContentType> = new Map();

    public readonly FieldTypeDescriptors: Map<Constructable<any>, IFieldTypeDecoratorOptions> = new Map();
}
