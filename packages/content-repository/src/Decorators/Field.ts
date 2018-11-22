import { Injector } from "@furystack/inject";
import "reflect-metadata";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { IValueType } from "../models";
import { ContentType, ContentTypeDecoratorOptions } from "./ContentType";

type decoratorOptins = IValueType & {Injector: Injector};

export const defaultFieldDecoratorOptions: decoratorOptins = {
    Injector: Injector.Default,
};

export const Field = (options?: Partial<decoratorOptins>) => {
    return (target: any, propertyKey: string) => {
        const mergedOptions = { ...defaultFieldDecoratorOptions, ...options };
        const store = mergedOptions.Injector.GetInstance(ContentDescriptorStore);
        let contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor);
        if (!contentTypeDescriptor) {
            ContentType({ Injector: mergedOptions.Injector })(target.constructor);
            contentTypeDescriptor = store.ContentTypeDescriptors.get(target.constructor) as ContentTypeDecoratorOptions<any>;
        }
        if (!contentTypeDescriptor.Fields) {
            contentTypeDescriptor.Fields = {};
        }

        if (contentTypeDescriptor && contentTypeDescriptor.Fields) {
            delete mergedOptions.Injector;
            contentTypeDescriptor.Fields[propertyKey] = mergedOptions;
        }
        store.ContentTypeDescriptors.set(target.constructor, contentTypeDescriptor);
    };
};
