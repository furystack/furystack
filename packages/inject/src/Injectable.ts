import "reflect-metadata";
import { Injector } from "./Injector";
import { Constructable } from "./Types/Constructable";

export const Injectable = () => {
    return <T extends Constructable<any>>(ctor: T) => {
        const meta = Reflect.getMetadata("design:paramtypes", ctor);
        meta && Injector.Default.meta.set(ctor, (meta as any[]).map((param) => {
            return param;
        }));
    };
};
