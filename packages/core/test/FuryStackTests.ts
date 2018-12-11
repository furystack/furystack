import { Injectable } from "@furystack/inject";
import { FuryStack, IApi } from "../src";

// tslint:disable:max-classes-per-file

export const stackBuilderTests = describe("StackBuilder", () => {
    it("Should be constructed without options", () => {
        const sb = new FuryStack();
        expect(sb).toBeInstanceOf(FuryStack);
    });

    it("Should be constructed with options", () => {
        const sb = new FuryStack({
            apis: [],
        });
        expect(sb).toBeInstanceOf(FuryStack);
    });

    describe("apis", () => {
        it("Should initialize with an empty API list", () => {
            const sb = new FuryStack();
            expect(sb.apis.length).toBe(0);
        });

        it("Apis should be added", () => {
            @Injectable()
            class Api1 implements IApi {
                public async activate() { /**  */ }
                public dispose() { /** */ }
            }
            const sb = new FuryStack({
                apis: [Api1],
            });
            expect(sb.apis[0]).toBeInstanceOf(Api1);
        });

        it("Should call apis.activate() on stack.start()", (done) => {

            @Injectable()
            class Api2 implements IApi {
                public async activate() {
                    done();
                }
                public dispose() { /** */ }
            }
            const sb = new FuryStack({
                apis: [Api2],
            });
            sb.start();
        });

        it("Dispose should dispose the APIs", (done) => {

            @Injectable()
            class Api implements IApi {
                public async activate() { /** */ }
                public dispose() { done(); }
            }
            const sb = new FuryStack({
                apis: [Api],
            });
            sb.start().then(() => {
                sb.dispose();
            });
        });
    });
});
