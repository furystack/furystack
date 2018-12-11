import "reflect-metadata";
import { Injector } from "./Injector";
import { Constructable } from "./Types/Constructable";

export interface InjectableOptions {
    ResolveDependencies: boolean;
}

export const defaultInjectableOptions: InjectableOptions = {
    ResolveDependencies: true,
};

export const Injectable = (options?: Partial<InjectableOptions>) => {
    return <T extends Constructable<any>>(ctor: T) => {
        const meta = Reflect.getMetadata("design:paramtypes", ctor);
        const metaValue = {
            Dependencies: meta && (meta as any[]).map((param) => {
                return param;
            }) || [],
            Options: {...defaultInjectableOptions, ...options},
        };
        Injector.Default.meta.set(ctor, metaValue);
    };
};
