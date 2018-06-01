import { expect } from "chai";
import { Server } from "tls";
import { IApi, StackBuilder } from "../src";

export const stackBuilderTests = describe("StackBuilder", () => {
    it("Should be constructed without server", () => {
        const sb = new StackBuilder(new Server());
        expect(sb).to.be.instanceof(StackBuilder);
    });

    describe("API", () => {
        it("Should initialize with an empty API list", () => {
            const sb = new StackBuilder(new Server());
            expect(sb.apis.length).to.be.eq(0);
        });

        it("Apis should be added", () => {
            const sb = new StackBuilder(new Server());
            const api: IApi<any> = {} as any;
            sb.apis.push(api);
            expect(sb.apis[0]).to.be.eq(api);
        });

        it("Should call apis.activate() on server.start()", (done) => {
            const sb = new StackBuilder(new Server());
            const api: IApi<any> = { activate: done } as any;
            sb.apis.push(api);
            sb.start();
        });

        it("Dispose should dispose the APIs", (done) => {
            const sb = new StackBuilder(new Server());
            const api: IApi<any> = { start: () => ({}), dispose: done } as any;
            sb.apis.push(api);
            sb.dispose();
        });

    });

});
