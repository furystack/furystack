import { Injector } from "@furystack/inject";
import "reflect-metadata";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { ContentType, IContentTypeDecoratorOptions } from "./ContentType";

export interface IVisibilityOption {
    ReadOnly?: boolean;
    Required?: boolean;
    ControlName?: string;
    Category?: string;
    Order?: number;
}

export interface IFieldTypeDecoratorOptions {
    Unique?: boolean;
    DisplayName?: string;
    Description?: string;
    DefaultValue?: string;
    Category?: string;
    Injector: Injector;
    Index?: number;
    Visible?: {
        Create?: IVisibilityOption,
        List?: IVisibilityOption,
        Details?: IVisibilityOption,
    };
}

export const defaultFieldDecoratorOptions: IFieldTypeDecoratorOptions = {
    Injector: Injector.Default,
};

export const Field = (options?: Partial<IFieldTypeDecoratorOptions>) => {
    return (target: any, propertyKey: string) => {
        const mergedOptions = { ...defaultFieldDecoratorOptions, ...options };
        const store = mergedOptions.Injector.GetInstance(ContentDescriptorStore);
        let contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor);
        if (!contentTypeDescriptor) {
            ContentType({ Injector: mergedOptions.Injector })(target.constructor);
            contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor) as IContentTypeDecoratorOptions;
        }
        contentTypeDescriptor.Fields.set(propertyKey, mergedOptions);
    };
};
