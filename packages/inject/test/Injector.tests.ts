import { IDisposable, usingAsync } from "@sensenet/client-utils";
import { expect } from "chai";
import { Injectable } from "../src/Injectable";
import { Injector } from "../src/Injector";

// tslint:disable:max-classes-per-file

export const injectorTests = describe("Injector", () => {
    it("Shold be constructed", () => {
        const i = new Injector();
        expect(i).to.be.instanceof(Injector);
    });

    it("Parent should be the default instance, if not specified", () => {
        const i = new Injector();
        // tslint:disable-next-line:no-string-literal
        expect(i["options"]["parent"]).to.be.eq(Injector.Default);
    });

    it("Should throw an error on circular dependencies", () => {
        const i = new Injector({});
        @Injectable()
        class InstanceClass { constructor(private _ohgodno: InstanceClass) { /** */ } }
        expect(() => i.GetInstance(InstanceClass)).to.throw();
    });

    it("Should set and return instance from cache", () => {
        const i = new Injector();
        @Injectable()
        class InstanceClass { constructor() { /** */ } }
        const instance = new InstanceClass();
        i.SetInstance(instance);
        expect(i.GetInstance(InstanceClass)).to.be.eq(instance);
    });

    it("Should return from a parent injector if available", () => {
        const i = new Injector();
        @Injectable()
        class InstanceClass { constructor() { /** */ } }
        const instance = new InstanceClass();
        Injector.Default.SetInstance(instance);
        expect(i.GetInstance(InstanceClass)).to.be.eq(instance);
        // tslint:disable-next-line:no-string-literal
        expect(Injector.Default["cachedSingletons"].get(InstanceClass)).to.be.eq(instance);
    });

    it("Should create instance on a parent injector if not available", () => {
        const i = new Injector();
        @Injectable()
        class InstanceClass { constructor() { /** */ } }
        expect(i.GetInstance(InstanceClass)).to.be.instanceof(InstanceClass);
        // tslint:disable-next-line:no-string-literal
        expect(Injector.Default["cachedSingletons"].get(InstanceClass)).to.be.instanceof(InstanceClass);
    });

    it("Should resolve parameters", () => {
        const i = new Injector();

        class Injected1 {}
        class Injected2 {}

        @Injectable()
        class InstanceClass { constructor(public injected1: Injected1, public injected2: Injected2) { /** */ } }
        expect(i.GetInstance(InstanceClass)).to.be.instanceof(InstanceClass);
        expect(i.GetInstance(InstanceClass).injected1).to.be.instanceof(Injected1);
        expect(i.GetInstance(InstanceClass).injected2).to.be.instanceof(Injected2);
    });

    it("Should resolve parameters recursively", () => {
        const i = new Injector();

        class Injected1 {}
        @Injectable()
        class Injected2 { constructor( public injected1: Injected1) {  }}

        @Injectable()
        class InstanceClass { constructor(public injected2: Injected2) { /** */ } }
        expect(i.GetInstance(InstanceClass)).to.be.instanceof(InstanceClass);
        expect(i.GetInstance(InstanceClass).injected2.injected1).to.be.instanceof(Injected1);
    });

    it("Should be disposed", async () => {
        await usingAsync(new Injector(),  async () => {/** */});
    });

    it("Should dispose cached entries on dispose and tolerate non-disposable ones", (done: MochaDone) => {
        class TestDisposable implements IDisposable {
            public dispose() {
                done();
            }
        }
        class TestInstance {}

        usingAsync(new Injector(),  async (i) => {
            i.SetInstance(new TestDisposable());
            i.SetInstance(new TestInstance());
        });
    });
});
