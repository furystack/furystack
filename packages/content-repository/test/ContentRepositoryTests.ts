import { usingAsync } from "@sensenet/client-utils";
import { expect } from "chai";
import { Connection } from "typeorm";
import { ContentRepository } from "../src/ContentRepository";

export const contentRepositoryTests = describe("Repository", () => {
    it("Can be constructed with default parameters", () => {
        const r = new ContentRepository();
        expect(r).to.be.instanceof(ContentRepository);

    });

    it("Can be initialized", async () => {
        await usingAsync(new ContentRepository(), async (r) => {
            expect(r).to.be.instanceof(ContentRepository);
            await r.Initialize();
            expect(r.GetConnection()).to.be.instanceOf(Connection);
            expect(r.GetConnection().isConnected).to.be.eq(true);
        });
    });

    it("Can be disposed", async () => {
        const r = new ContentRepository();
        await r.Initialize();
        await r.dispose();
        expect(r.GetConnection().isConnected).to.be.eq(false);
    });
});
