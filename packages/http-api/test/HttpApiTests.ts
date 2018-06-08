import { IContext } from "@furystack/core";
import { expect } from "chai";
import { RequestContext } from "../src";
import { HttpApi } from "../src/HttpApi";

export const httpApiTests = describe("HttpApi tests", () => {
    it("Can be constructed", () => {
        const api = new HttpApi({});
        expect(api).to.be.instanceof(HttpApi);
    });

    describe("Server", () => {
        it("activate should start the server to listen", (done) => {
            const api = new HttpApi({
                serverFactory: (listener) => ({
                    listen: () => done(),
                } as any),
            });
            api.activate();
        });

        it("dispose should close the server", (done) => {
            const api = new HttpApi({
                serverFactory: (listener) => ({
                    close: () => done(),
                } as any),
            });
            api.dispose();
        });

        it("mainRequestListener should be attached", () => {
            const api = new HttpApi({
                serverFactory: (listener) => {
                    return {
                        listener,
                    } as any;
                },
            });
            // tslint:disable-next-line:no-string-literal
            expect((api as any)["server"]["listener"]).to.be.eq(api.mainRequestListener);
        });
    });

    describe("mainRequestListener", () => {
        it("Should trigger the default action by default", (done) => {
            const api = new HttpApi({
                defaultAction: { exec: () => done() } as any,
            });
            api.mainRequestListener({ url: "/" } as any, undefined as any);
        });

        it("Should trigger the notFound action for not found routes", (done) => {
            const api = new HttpApi({
                notFoundAction: { exec: () => done() } as any,
            });
            api.mainRequestListener({ url: "/invalid/route" } as any, undefined as any);
        });

        it("contextFactory should return the same context instance in methods", (done) => {
            const api = new HttpApi({
                defaultAction: {
                    exec: (_in: any, _sr: any, _ctx: () => IContext) => {
                        const context = _ctx();
                        const context2 = _ctx();

                        expect(context).to.be.eq(context2);
                        done();
                    },
                } as any,
            });
            api.mainRequestListener({ url: "/" } as any, undefined as any);
        });

    });

    it("ContextFactory should work with RequestContext objects", () => {
        const api = new HttpApi();
        expect(api.contextFactory(undefined as any, undefined as any, undefined as any)).to.be.instanceof(RequestContext);
    });
});
