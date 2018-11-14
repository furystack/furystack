import { Injectable } from "../src";

// tslint:disable:max-classes-per-file
export const injectTests = describe("Tests", () => {
    it("Should decorate classes", () => {
        @Injectable() class Alma { }
        const a = new Alma();
        expect(a).toBeInstanceOf(Alma);
    });

    it("Should resolve ctor parameters", () => {
        class Service { public value = 1; }

        @Injectable() class Alma2 {
            constructor(public service: Service) {
            }
        }
        // const a = new Injected(null as any);
        // expect(a).to.be.instanceof(Alma);
    });

});
