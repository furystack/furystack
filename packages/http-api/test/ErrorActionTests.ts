import { visitorUser } from "@furystack/core";
import { expect } from "chai";
import { OutgoingHttpHeaders } from "http";
import { ErrorAction } from "../src";

export const errorActionTests = describe("ErrorAction tests", () => {
    it("should be constructed without parameters", () => {
        const c = new ErrorAction();
        expect(c).to.be.instanceof(ErrorAction);
        expect(c.segmentName).to.be.eq("");
    });

    it("Should throw when executing", () => {
        const c = new ErrorAction();
        expect(() => c.exec(undefined as any, undefined as any, undefined as any)).to.throw();
    });

    it("should return stringified error message", async () => {
        const error = new ErrorAction();
        const response = {
            writeHead: (code: number, message: OutgoingHttpHeaders, headers: any) => {
                expect(code).to.be.eq(500);
                expect(message).to.be.eq("Server error");
                expect(headers).to.be.deep.eq({ "Content-Type": "application/json" });
            },
            write: (body: string) => {
                expect(JSON.parse(body)).to.be.deep.eq({ message: ":(", stack: "stack" });
            },
            end: () => undefined,
        };
        await error.returnError({} as any, response as any, () => ({
            getCurrentUser: async () => visitorUser,
            isAuthenticated: async () => true,
            isAuthorized: async () => true,
            getEntityStore: () => undefined,
        }), { message: ":(", stack: "stack" });
    });
});
