import { Injector } from "@furystack/inject";
import { usingAsync } from "@sensenet/client-utils";
import "../src";
import { ElevatedUserContext, SchemaSeeder, SystemContent } from "../src";
import { ContentSeeder } from "../src/Seeders/ContentSeeder";

export const seederTests = describe("ContentSeeder", () => {
  it("Can be constructed with default parameters", async () => {
    await usingAsync(new Injector({ parent: undefined }), async (i) => {
      const s = i.GetInstance(ContentSeeder);
      expect(s).toBeInstanceOf(ContentSeeder);
    });
  });

  it("Seed can be triggered", async () => {
    await usingAsync(new Injector({ parent: undefined }), async (i) => {
      const systemContent = i.GetInstance(SystemContent);
      await usingAsync(ElevatedUserContext.Create(i), async () => {
        const ss = i.GetInstance(SchemaSeeder);
        await ss.SeedBuiltinEntries();
        const s = i.GetInstance(ContentSeeder);
        await s.SeedSystemContent();
        expect(systemContent.VisitorUser.Username).toEqual("Visitor");
        expect(systemContent.VisitorRole.Name).toEqual("Visitor");
      });
    });
  });
});
