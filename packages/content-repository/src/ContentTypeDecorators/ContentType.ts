import { Constructable } from "@furystack/inject";
import "reflect-metadata";
import { ContentRepository } from "../ContentRepository";

export interface IContentTypeDecoratorOptions {
    repository: ContentRepository;
}

export const ContentType = (options?: IContentTypeDecoratorOptions) => {
    return <T extends Constructable<any>>(ctor: T) => {
        const meta = Reflect.getMetadata("design:properties", ctor);
        // meta && injector.meta.set(ctor.name, (meta as any[]).map((param) => {
        //     injector.options.scope[param.name] = param;
        //     return param.name;
        // }));
        // injector.options.scope[ctor.name] = ctor;
        return class extends ctor {
            constructor(...args: any[]) {
                super(...args);
            }
        };
    };
};
