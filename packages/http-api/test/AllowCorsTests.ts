import { IContext, visitorUser } from "@furystack/core";
import { expect } from "chai";
import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from "http";
import { AllowCors } from "../src/ActionDecorators";
import { RequestAction } from "../src/RequestAction";

class MockRequestAction extends RequestAction {
    public async exec(_incomingMessage: IncomingMessage, _serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        /** */
    }
    public segmentName: string = "ExampleSegment";
}

export const allowCorsTests = describe("AllowCors decorator tests", () => {
    it("Action should be constructed", () => {
        const a = new MockRequestAction();
    });

    it("should return stringified self when doesn't have parent", async () => {
        const ctor = (AllowCors({
            credentials: true,
            inherits: true,
            origins: ["localhost"],
        })(MockRequestAction));
        const c = new ctor();
        const response = {
            setHeader: (name: string, value: string) => {
                /** */
            },
            writeHead: (code: number, message: OutgoingHttpHeaders) => {
                /** */
            },
            write: (body: string) => {
                /** */
            },
            end: () => undefined,
        };
        await c.exec({
            headers: { origin: "localhost" },
        } as any, response as any, () => ({
            getCurrentUser: async () => visitorUser,
            isAuthenticated: async () => true,
            isAuthorized: async () => true,
            getEntityStore: () => undefined,
        }));
    });

    it("Should append headers on Resolve", () => {
        const headers: any = {};

        const ctor = (AllowCors({
            credentials: true,
            inherits: true,
            origins: ["localhost"],
        })(MockRequestAction));
        const c = new ctor();
        const response = {
            setHeader: (name: string, value: string) => {
                headers[name] = value;
                // done();
            },
            writeHead: (code: number, message: OutgoingHttpHeaders) => {
                /** */
            },
            write: (body: string) => {
                /** */
            },
            end: () => undefined,
        };
        c.resolve(["child"], {
            headers: { origin: "localhost" },
        } as any, response as any);
        expect(headers).to.be.deep.eq({
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": "localhost",
        });
    });
});
