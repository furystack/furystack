import { IContext, visitorUser } from "@furystack/core";
import { expect } from "chai";
import { IncomingMessage, ServerResponse } from "http";
import { Authorize } from "../src/ActionDecorators/Authorize";
import { RequestAction } from "../src/RequestAction";

@Authorize()
class MockRequestAction extends RequestAction {
    public async exec(_incomingMessage: IncomingMessage, _serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        /** */
    }
    public segmentName: string = "ExampleSegment";
}

export const authorizeDecoratorTests = describe("Authorize decorator", () => {
    it("exec should fail when trying to execute with a different method", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({} as any, {
            writeHead: (code: number, method: string) => {
                expect(code).to.be.eq(403);
                expect(method).to.be.eq("Forbidden");
            },
            end: () => done(),
        } as any as ServerResponse, () => ({
            isAuthenticated: async () => false,
            isAuthorized: async () => false,
            getEntityStore: () => undefined,
            getCurrentUser: async () => visitorUser,
        }))
            .then(() => { /** */ })
            .catch(() => {/** */ });
    });

    it("exec should succeed on method match", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({ method: "POST" } as any, {} as any, () => ({
            isAuthenticated: async () => false,
            isAuthorized: async () => true,
            getEntityStore: () => undefined,
            getCurrentUser: async () => visitorUser,
        }))
            .then(() => done())
            .catch((err) => done(err));
    });
});
