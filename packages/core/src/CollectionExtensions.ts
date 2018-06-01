import { IDisposable } from "@sensenet/client-utils";
import { IActivateable } from "./Models/IActivateable";

export const attachCollectionBehaviour = <K, T extends Iterable<K>= Iterable<K>>(collection: T, behaviour: (collection: T & K) => T & K) => behaviour(collection as T & K);
export const makeCollectionActivateable = <T extends IActivateable, T2 extends Iterable<T>>(collection: T2) => attachCollectionBehaviour<T, T2>(collection, (c) => {
    c.activate = async () => {
        await Promise.all(Array.from(collection).map((item) => item.activate()));
    };
    return c;
});

export const makeCollectionDisposable = <T extends IDisposable, T2 extends Iterable<T>>(collection: T2) => attachCollectionBehaviour<T, T2>(collection, (c) => {
    c.dispose = async () => {
        await Promise.all(Array.from(collection).map((item) => item.dispose()));
    };
    return c;
});
