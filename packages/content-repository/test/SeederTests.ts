import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { Seeder } from "../src/Seeder";

export const seederTests = describe("Seeder", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(Seeder);
            expect(s).toBeInstanceOf(Seeder);
        });
    });

    it("Seed can be triggered", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(Seeder);
            await s.SeedBuiltinEntries();
        });

    });

});
