import { expect } from "chai";
import { Server } from "tls";
import { FuryStack, IApi, IService } from "../src";

export const stackBuilderTests = describe("StackBuilder", () => {
    it("Should be constructed without options", () => {
        const sb = new FuryStack();
        expect(sb).to.be.instanceof(FuryStack);
    });

    it("Should be constructed with options", () => {
        const sb = new FuryStack({
            apis: [],
            services: [],
        });
        expect(sb).to.be.instanceof(FuryStack);
    });

    describe("Logger", () => {
        it("Should add stack logger to APIs", (done) => {
            const sb = new FuryStack({
                apis: [
                    {
                        loggers: {
                            attachLogger: () => done(),
                        } as any,
                    } as any,
                ],
            });
        });

        it("Should add stack logger to services", (done) => {
            const sb = new FuryStack({
                services: [
                    {
                        loggers: {
                            attachLogger: () => done(),
                        } as any,
                    } as any,
                ],
            });
        });
    });

    describe("apis", () => {
        it("Should initialize with an empty API list", () => {
            const sb = new FuryStack();
            expect(sb.apis.length).to.be.eq(0);
        });

        it("Apis should be added", () => {
            const api: IApi<any> = {} as any;
            const sb = new FuryStack({
                apis: [api],
            });
            expect(sb.apis[0]).to.be.eq(api);
        });

        it("Should call apis.activate() on stack.start()", (done) => {

            const api: IApi<any> = { activate: done } as any;
            const sb = new FuryStack({
                apis: [api],
            });
            sb.start();
        });

        it("Dispose should dispose the APIs", (done) => {
            const api: IApi<any> = { start: () => ({}), dispose: done } as any;
            const sb = new FuryStack({
                apis: [api],
            });
            sb.dispose();
        });
    });

    describe("services", () => {
        it("Should initialize with an empty service list", () => {
            const sb = new FuryStack();
            expect(sb.services.length).to.be.eq(0);
        });

        it("Services should be added", () => {
            const service: IService = {} as any;
            const sb = new FuryStack({
                services: [service],
            });
            expect(sb.services[0]).to.be.eq(service);
        });

        it("Should call services.start() on stack.start()", (done) => {
            const service: IService = { start: () => done() } as any;
            const sb = new FuryStack({
                services: [service],
            });
            sb.start();
        });

        it("Should call services.stop() on stack.dispose()", (done) => {
            const service: IService = { stop: () => done() } as any;
            const sb = new FuryStack({
                services: [service],
            });
            sb.dispose();
        });
    });

});
