import { IDisposable } from "@sensenet/client-utils";
import { expect } from "chai";
import { Server } from "tls";
import { makeCollectionActivateable, makeCollectionDisposable } from "../src/CollectionExtensions";
import { IActivateable } from "../src/Models/IActivateable";

class DummyActivateable implements IActivateable, IDisposable {
    public isActivated = false;
    public isDisposed = false;
    public activate: () => Promise<void> = async () => { this.isActivated = true; };
    public dispose: () => void = () => { this.isDisposed = true; };
}

export const collectionExtensionsTests = describe("Collection extensions", () => {
    it("Extensions can be mixed", () => {
        const collection = makeCollectionActivateable(makeCollectionDisposable([new DummyActivateable()]));
        expect(collection.activate).to.be.instanceof(Function);
        expect(collection.dispose).to.be.instanceof(Function);
    });
});

export const makeCollectionActivateableTests = describe("makeCollectionActivateable", () => {

    const item1: IActivateable = { activate: async () => undefined };
    const item2: IActivateable = { activate: async () => undefined };
    const item3: IActivateable = { activate: async () => undefined };

    it("Should be called on array with IActivateables", () => {
        const collection = makeCollectionActivateable([item1, item2, item3]);
        expect(collection.activate).to.be.instanceof(Function);
    });

    it("Activate should activate all items", async () => {
        const dummyItem1 = new DummyActivateable();
        const dummyItem2 = new DummyActivateable();
        const dummyItem3 = new DummyActivateable();

        const collection = makeCollectionActivateable([dummyItem1, dummyItem2, dummyItem3]);

        for (const item of collection) {
            expect(item.isActivated).to.be.eq(false);
            expect(item.isDisposed).to.be.eq(false);
        }

        await collection.activate();

        for (const item of collection) {
            expect(item.isActivated).to.be.eq(true);
            expect(item.isDisposed).to.be.eq(false);
        }
    });
});

export const makeCollectionDisposableTests = describe("makeCollectionDisposable", () => {

    const item1: IDisposable = { dispose: () => undefined };
    const item2: IDisposable = { dispose: () => undefined };
    const item3: IDisposable = { dispose: () => undefined };

    it("Should be called on array with IActivateables", () => {
        const collection = makeCollectionDisposable([item1, item2, item3]);
        expect(collection.dispose).to.be.instanceof(Function);
    });

    it("Should dispose all items", () => {
        const dummyItem1 = new DummyActivateable();
        const dummyItem2 = new DummyActivateable();
        const dummyItem3 = new DummyActivateable();

        const collection = makeCollectionDisposable([dummyItem1, dummyItem2, dummyItem3]);

        for (const item of collection) {
            expect(item.isActivated).to.be.eq(false);
            expect(item.isDisposed).to.be.eq(false);
        }

        collection.dispose();

        for (const item of collection) {
            expect(item.isActivated).to.be.eq(false);
            expect(item.isDisposed).to.be.eq(true);
        }
    });
});
