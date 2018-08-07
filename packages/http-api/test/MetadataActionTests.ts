import { visitorUser } from "@furystack/core";
import { Injector } from "@furystack/inject";
import { expect } from "chai";
import { OutgoingHttpHeaders } from "http";
import { MetadataAction, RouteAction } from "../src";

export const metadataActionTests = describe("MetadataAction tests", () => {
    it("should be constructed without parameters", () => {
        const c = new MetadataAction();
        expect(c).to.be.instanceof(MetadataAction);
        expect(c.segmentName).to.be.eq("metadata");
    });

    it("should return stringified self when doesn't have parent", async () => {
        const c = new MetadataAction();
        const response = {
            writeHead: (code: number, message: OutgoingHttpHeaders) => {
                expect(code).to.be.eq(200);
                expect(message).to.be.deep.eq({ "Content-Type": "application/json" });
            },
            write: (body: string) => {
                expect(body).to.be.deep.eq(JSON.stringify({ message: "Root" }));
            },
            end: () => undefined,
        };
        await c.exec({} as any, response as any, () => ({
            getCurrentUser: async () => visitorUser,
            isAuthenticated: async () => true,
            isAuthorized: async () => true,
            getInjector: () => new Injector(),
        }));
    });

    it("should return stringified route when have parents", async () => {
        const metadata = new MetadataAction();
        const c = new RouteAction("exampleRoute", metadata);
        const response = {
            writeHead: (code: number, message: OutgoingHttpHeaders) => {
                expect(code).to.be.eq(200);
                expect(message).to.be.deep.eq({ "Content-Type": "application/json" });
            },
            write: (body: string) => {
                expect(JSON.parse(body)).to.be.deep.eq({ message: "Root" });
            },
            end: () => undefined,
        };
        await metadata.exec({} as any, response as any, () => ({
            getCurrentUser: async () => visitorUser,
            isAuthenticated: async () => true,
            isAuthorized: async () => true,
            getEntityStore: () => undefined,
            getInjector: () => new Injector(),
        }));
    });
});
