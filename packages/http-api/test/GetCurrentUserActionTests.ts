import { expect } from "chai";
import { GetCurrentUser } from "../src/GetCurrentUser";

export const getCurrentUserTests = describe("getCurrentUser", () => {
    it("should be constructed without parameters", () => {
        const c = new GetCurrentUser();
        expect(c).to.be.instanceof(GetCurrentUser);
    });

    it("exec", async () => {
        const c = new GetCurrentUser();
        await c.exec({
            method: "GET",
        } as any, {
            writeHead: () => undefined,
            write: (data: string) => {
                expect(data).to.be.eq(JSON.stringify({ Email: "ExampleUser" }));
            },
            end: () => undefined,
        } as any, () => ({
            getCurrentUser: async () => {
                return { Email: "ExampleUser", Password: "" };
            },
        } as any));
    });
});
