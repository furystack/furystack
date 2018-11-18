import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { ContentRepository } from "../src";
import { ContentSeeder } from "../src/Seeders/ContentSeeder";

export const seederTests = describe("Seeder", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(ContentSeeder);
            expect(s).toBeInstanceOf(ContentSeeder);
        });
    });

    it("Seed can be triggered", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const r = i.GetInstance(ContentRepository);
            await r.activate();
            const s = i.GetInstance(ContentSeeder);
            await s.SeedSystemContent();
        });
    });

});
