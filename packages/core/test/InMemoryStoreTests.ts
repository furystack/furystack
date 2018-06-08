import { expect } from "chai";
import { InMemoryStore } from "../src/InMemoryStore";

// tslint:disable:no-string-literal

export const inMemoryStoreTests = describe("InMemoryStore", () => {

    let f!: InMemoryStore<{ id: number, value: string }>;

    beforeEach(() => {
        f = new InMemoryStore<{ id: number, value: string }>("example.txt", "id", 1000);
    });

    it("should be constructed with default parameters", () => {
        const f2 = new InMemoryStore<{ id: number, value: string }>("example.txt", "id");
        expect(f2).to.be.instanceof(InMemoryStore);
    });

    it("Update should set a value", async () => {
        await f.update(1, { id: 1, value: "asd" });
        const count = await f.count();
        expect(count).to.be.eq(1);
        const persisted = await f.get(1);
        expect(persisted).to.be.deep.eq({ id: 1, value: "asd" });
    });

    it("filter should return the corresponding entries", async () => {
        f.update(1, { id: 1, value: "asd" });
        f.update(2, { id: 2, value: "def" });
        f.update(3, { id: 3, value: "def" });

        const result = await f.filter({ value: "def" });
        expect(result.length).to.be.eq(2);
    });
});
