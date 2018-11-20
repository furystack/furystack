import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { ElevatedRepository } from "../src/ElevatedRepository";

export const contentRepositoryTests = describe("Repository", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const r = i.GetInstance(ElevatedRepository);
            expect(r).toBeInstanceOf(ElevatedRepository);
        });

    });

    // it("Can be initialized", async () => {
    //     await usingAsync(new Injector({ parent: undefined }), async (i) => {
    //         await usingAsync(i.GetInstance(ElevatedRepository), async (r) => {
    //             jest.setTimeout(100000);
    //             await r.activate();
    //             const connection = r.GetManager().connection;
    //             expect(connection).toBeInstanceOf(Connection);
    //             expect((connection as any).isConnected).toBe(true);
    //         });
    //     });
    // });

    // it("Content 1 can be loaded", async () => {
    //     await usingAsync(new Injector({ parent: undefined }), async (i) => {
    //         await usingAsync(i.GetInstance(ElevatedRepository), async (r) => {
    //             jest.setTimeout(100000);
    //             await r.activate();
    //             const content = await r.LoadContent(Role, [1], "Create");
    //             expect(content).toBeInstanceOf(Object);
    //         });
    //     });
    // });

    // it("Content can be searched", async () => {
    //     await usingAsync(new Injector({ parent: undefined }), async (i) => {
    //         await usingAsync(i.GetInstance(ElevatedRepository), async (r) => {
    //             jest.setTimeout(100000);
    //             await r.activate();
    //             const content = await r.findContent(Role, "Create", { Name: "Visitor" });
    //             expect(content).toBeTruthy();
    //         });
    //     });
    // });
});
