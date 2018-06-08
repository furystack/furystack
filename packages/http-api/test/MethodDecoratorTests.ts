import { IContext } from "@furystack/core";
import { expect } from "chai";
import { IncomingMessage, ServerResponse } from "http";
import { Method } from "../src/ActionDecorators/Method";
import { RequestAction } from "../src/RequestAction";

@Method("POST")
class MockRequestAction extends RequestAction {
    public async exec(_incomingMessage: IncomingMessage, _serverResponse: ServerResponse, _getContext: () => IContext): Promise<void> {
        /** */
    }
    public segmentName: string = "ExampleSegment";
}

export const methodDecoratorTests = describe("Method decorator", () => {
    it("exec should fail when trying to execute with a different method", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({ method: "GET" } as any, {
            writeHead: (code: number, method: string) => {
                expect(code).to.be.eq(405);
                expect(method).to.be.eq("Method Not Allowed");
            },
            end: () => done(),
        } as any as ServerResponse, null as any)
            .then(() => { /** */ })
            .catch(() => {/** */ });
    });

    it("exec should succeed on method match", (done: MochaDone) => {
        const action = new MockRequestAction();
        action.exec({ method: "POST" } as any, {} as any, () => ({}) as any)
            .then(() => done())
            .catch((err) => done(err));
    });
});
