import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { SchemaSeeder } from "../src/Seeders/SchemaSeeder";

export const seederTests = describe("Seeder", () => {
    it("Can be constructed with default parameters", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(SchemaSeeder);
            expect(s).toBeInstanceOf(SchemaSeeder);
        });
    });

    it("Seed can be triggered", async () => {
        await usingAsync(new Injector({ parent: undefined }), async (i) => {
            const s = i.GetInstance(SchemaSeeder);
            try {
                await s.SeedBuiltinEntries();
            } catch (error) {
                throw error;
            }

        });
    });

});
