import { Constructable, Injector as FInjector } from "@furystack/inject";
import "reflect-metadata";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { ContentType as ContentTypeModel} from "../models";

export type ContentTypeDecoratorOptions<T> = ContentTypeModel<T> & {Injector: FInjector};

export const ContentType = <T>(options?: Partial<ContentTypeDecoratorOptions<T>>) => {
    return <T2 extends Constructable<any>>(ctor: T2) => {
        const defaultOptions: ContentTypeDecoratorOptions<T> = {
            Name: ctor.name,
            Injector: FInjector.Default,
            JobTypePermissions: [],
            Permissions: [],
        };
        const injector = options && options.Injector || defaultOptions.Injector;
        const store = injector.GetInstance(ContentDescriptorStore);
        const existingOptions = store.ContentTypeDescriptors.get(ctor);
        const mergedOptions = {
            ...defaultOptions,
            ...existingOptions,
            ...options,
        } as ContentTypeDecoratorOptions<T>;
        delete mergedOptions.Injector;

        // tslint:disable-next-line:no-shadowed-variable
        const {Injector, ...contentType} = Object.assign(new ContentTypeModel(), {...mergedOptions});
        store.ContentTypeDescriptors.set(ctor, contentType as ContentTypeModel);
    };
};
