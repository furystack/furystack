import { Constructable, Injector } from "@furystack/inject";
import "reflect-metadata";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { IFieldTypeDecoratorOptions } from "./Field";
import { IReferenceTypeDecoratorOptions } from "./Reference";

export interface IContentTypeDecoratorOptions {
    Name?: string;
    DisplayName?: string;
    Description?: string;
    Category?: string;
    Fields: Map<string, IFieldTypeDecoratorOptions>;
    References: Map<string, IReferenceTypeDecoratorOptions>;
    Injector: Injector;
}

const getDefaultContentTypeDecoratorOptions = () => ({
    Fields: new Map(),
    References: new Map(),
    Injector: Injector.Default,
} as IContentTypeDecoratorOptions);

export const ContentType = (options?: Partial<IContentTypeDecoratorOptions>) => {
    return <T extends Constructable<any>>(ctor: T) => {
        const defaultOptions = getDefaultContentTypeDecoratorOptions();
        const mergedOptions = { ...defaultOptions, ...options };
        const store = mergedOptions.Injector.GetInstance(ContentDescriptorStore).ContentTypeDescriptors;
        const existing = store.get(ctor);
        store.set(ctor, {
            ...defaultOptions,
            ...existing,
            ...options,
        });
    };
};
