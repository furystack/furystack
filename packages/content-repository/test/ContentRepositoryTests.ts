import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { Connection } from "typeorm";
import { ContentRepository } from "../src/ContentRepository";

export const contentRepositoryTests = describe("Repository", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const r = i.GetInstance(ContentRepository);
            expect(r).toBeInstanceOf(ContentRepository);
        });

    });

    it("Can be initialized", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {

            usingAsync(i.GetInstance(ContentRepository), async (r) => {
                await r.activate();
                const connection = r.GetConnection();
                expect(connection).toBeInstanceOf(Connection);
                expect((connection as any).isConnected).toEqual(true);
            });
        });
    });
});
