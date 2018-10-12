import "reflect-metadata";
import { Injector } from "./Injector";
import { Constructable } from "./Types/Constructable";

export const Injectable = (injector: Injector= Injector.Default) => {
    return <T extends Constructable<any>>(ctor: T) => {
        const meta = Reflect.getMetadata("design:paramtypes", ctor);
        meta && injector.meta.set(ctor.name, (meta as any[]).map((param) => {
            injector.options.scope[param.name] = param;
            return param.name;
        }));
        injector.options.scope[ctor.name] = ctor;
        return class extends ctor {
            constructor(...args: any[]) {
                super(...args);
            }
        };
    };
};
