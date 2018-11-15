import { Constructable, Injector } from "@furystack/inject";
import "reflect-metadata";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { ContentType, IContentTypeDecoratorOptions } from "./ContentType";

export interface IReferenceVisibilityOption {
    Category?: string;
    Visible?: boolean;
    ReadOnly?: boolean;
    Required?: boolean;
    ControlName?: string;
    Order: number;
}

export interface IReferenceTypeDecoratorOptions {
    AllowMultiple: boolean;
    DisplayName?: string;
    Description?: string;
    DefaultValue?: string;
    Category?: string;
    AllowedTypes: Array<Constructable<any>>;
    Injector: Injector;
    Aspects?: {
        [s: string]: IReferenceVisibilityOption,
    };
}

export const getDefaultFieldDecoratorOptions = () => ({
    Injector: Injector.Default,
    AllowMultiple: false,
    AllowedTypes: [],
} as IReferenceTypeDecoratorOptions);

export const Reference = (options?: Partial<IReferenceTypeDecoratorOptions>) => {
    return (target: any, propertyKey: string) => {
        const defaultOptions = getDefaultFieldDecoratorOptions();
        const mergedOptions = { ...defaultOptions, ...options };
        const store = (mergedOptions.Injector || Injector.Default).GetInstance(ContentDescriptorStore);
        let contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor);
        mergedOptions.AllowedTypes.map((t) => ContentType({ Injector: mergedOptions.Injector })(t));
        if (!contentTypeDescriptor) {
            ContentType({ Injector: mergedOptions.Injector })(target.constructor);
            contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor) as IContentTypeDecoratorOptions;
        }
        contentTypeDescriptor.References.set(propertyKey, mergedOptions);
    };
};
