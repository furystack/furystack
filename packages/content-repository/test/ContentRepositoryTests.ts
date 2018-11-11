import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { expect } from "chai";
import { Connection } from "typeorm";
import { ContentRepository } from "../src/ContentRepository";

export const contentRepositoryTests = describe("Repository", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({parent: undefined}), async (i) => {
            const r = i.GetInstance(ContentRepository);
            expect(r).to.be.instanceof(ContentRepository);
        });

    });

    it("Can be initialized", async () => {
        await usingAsync(new Injector({parent: undefined}), async (i) => {
            usingAsync(i.GetInstance(ContentRepository), async (r) => {
                await r.activate();
                const connection = r.GetConnection();
                expect(connection).to.be.instanceOf(Connection);
                expect((connection as any).isConnected).to.be.eq(true);
            });
        });
    });
});
