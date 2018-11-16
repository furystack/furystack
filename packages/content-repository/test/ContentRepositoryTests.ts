import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import { Connection } from "typeorm";
import "../src";
import { ContentRepository } from "../src/ContentRepository";
import { Role } from "../src/models";

export const contentRepositoryTests = describe("Repository", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const r = i.GetInstance(ContentRepository);
            expect(r).toBeInstanceOf(ContentRepository);
        });

    });

    it("Can be initialized", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            await usingAsync(i.GetInstance(ContentRepository), async (r) => {
                jest.setTimeout(100000);
                await r.activate();
                const connection = r.GetManager().connection;
                expect(connection).toBeInstanceOf(Connection);
                expect((connection as any).isConnected).toBe(true);
            });
        });
    });

    it("Content 1 can be loaded", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            await usingAsync(i.GetInstance(ContentRepository), async (r) => {
                jest.setTimeout(100000);
                await r.activate();
                const content = await r.LoadContent(Role, 1, "Create");
                expect(content).toBeInstanceOf(Object);
            });
        });
    });
});
