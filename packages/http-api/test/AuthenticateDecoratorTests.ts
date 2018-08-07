import { IContext, visitorUser } from "@furystack/core";
import { Injector } from "@furystack/inject";
import { expect } from "chai";
import { IncomingMessage, ServerResponse } from "http";
import { Authenticate } from "../src/ActionDecorators";
import { RequestAction } from "../src/RequestAction";

@Authenticate()
class MockRequestAction extends RequestAction {
    public async exec(_incomingMessage: IncomingMessage, _serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        /** */
    }
    public segmentName: string = "ExampleSegment";
}

export const authenticateDecoratorTests = describe("Authenticate decorator", () => {
    it("exec should fail when trying to execute with a different method", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({} as any, {
            writeHead: (code: number, method: string) => {
                expect(code).to.be.eq(401);
                expect(method).to.be.eq("Unauthorized");
            },
            end: () => done(),
        } as any as ServerResponse, () => ({
            isAuthenticated: async () => false,
            isAuthorized: async () => false,
            getEntityStore: () => undefined,
            getCurrentUser: async () => visitorUser,
            getInjector: () => new Injector(),

        }))
            .then(() => { /** */ })
            .catch(() => {/** */ });
    });

    it("exec should succeed on method match", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({ method: "POST" } as any, {} as any, () => ({
            isAuthenticated: async () => true,
            isAuthorized: async () => false,
            getEntityStore: () => undefined,
            getCurrentUser: async () => visitorUser,
            getInjector: () => new Injector(),

        }))
            .then(() => done())
            .catch((err) => done(err));
    });
});
