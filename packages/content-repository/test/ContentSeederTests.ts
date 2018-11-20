import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { ContentSeeder } from "../src/Seeders/ContentSeeder";

export const seederTests = describe("ContentSeeder", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(ContentSeeder);
            expect(s).toBeInstanceOf(ContentSeeder);
        });
    });

    // it("Seed can be triggered", async () => {
    //     await usingAsync(new Injector({ parent: undefined }), async (i) => {
    //         const s = i.GetInstance(ContentSeeder);
    //         await s.SeedSystemContent();
    //     });
    // });

});
