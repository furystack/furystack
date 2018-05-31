import { expect } from "chai";
import { Server } from "tls";
import { ActivateableCollection, IActivateable } from "../src";

class DummyActivateable implements IActivateable {
    public isActivated = false;
    public isDisposed = false;
    public activate: () => Promise<void> = async () => { this.isActivated = true; };
    public dispose: () => void = () => { this.isDisposed = true; };
}

export const activateableCollectionTests = describe("ActivateableCollection", () => {

    const item1: IActivateable = { activate: async () => undefined, dispose: async () => undefined };
    const item2: IActivateable = { activate: async () => undefined, dispose: async () => undefined };
    const item3: IActivateable = { activate: async () => undefined, dispose: async () => undefined };

    it("Should be constructed without items", () => {
        const collection = new ActivateableCollection();
        expect(collection).to.be.instanceof(ActivateableCollection);
    });

    describe("Iterator", () => {
        it("Should be able to iterate through the items", () => {

            const collection = new ActivateableCollection(item1, item2, item3);
            expect(collection.next().value).to.be.eq(item1);
            expect(collection.next().value).to.be.eq(item2);
            expect(collection.next().value).to.be.eq(item3);
            expect(collection.next().value).to.be.eq(undefined);
        });

        it("Should be able to iterate with for-of", () => {
            const collection = new ActivateableCollection(item1, item2, item3);
            for (const item of collection) {
                expect(item).to.be.instanceof(Object);
            }
        });
    });

    describe("Activate", () => {
        it("Should activate all items", async () => {
            const dummyItem1 = new DummyActivateable();
            const dummyItem2 = new DummyActivateable();
            const dummyItem3 = new DummyActivateable();

            const collection = new ActivateableCollection(dummyItem1, dummyItem2, dummyItem3);

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

    describe("Dispose", () => {
        it("Should dispose all items", () => {
            const dummyItem1 = new DummyActivateable();
            const dummyItem2 = new DummyActivateable();
            const dummyItem3 = new DummyActivateable();

            const collection = new ActivateableCollection(dummyItem1, dummyItem2, dummyItem3);

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

        it("Should throw an error on multiple triggers", async () => {
            const collection = new ActivateableCollection();
            await collection.dispose();
            try {
                await collection.dispose();
            } catch (error) {
                /** */
                expect(error).to.be.instanceof(Error);
            }
        });
    });

});
