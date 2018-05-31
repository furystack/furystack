import { IDisposable } from "@sensenet/client-utils";
import { IActivateable } from "./Models/IActivateable";

export const attachCollectionBehaviour = <K, T extends K[] = K[]>(collection: T, behaviour: (collection: T & K) => T & K) => behaviour(collection as T & K);
export const makeCollectionActivateable = <T extends IActivateable>(collection: T[]) => attachCollectionBehaviour<T>(collection, (c) => {
    c.activate = async () => {
        await Promise.all((collection).map((item) => item.activate()));
    };
    return c;
});

export const makeCollectionDisposable = <T extends IDisposable>(collection: T[]) => attachCollectionBehaviour<T>(collection, (c) => {
    c.dispose = async () => {
        await Promise.all((collection).map((item) => item.dispose()));
    };
    return c;
});
