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

    it("Should throw an error if class is not defined on the scope", () => {
        class Service { }
        const i = new Injector({scope: {}});
        @Injectable(i)
        class InstanceClass { constructor(private _service: Service) { /** */ } }
        expect(() => i.GetInstance(InstanceClass)).to.throw();
    });

    it("Should throw an error on circular dependencies", () => {
        const scope: any = {};
        const i = new Injector({scope});
        @Injectable(i)
        class InstanceClass { constructor(private _ohgodno: InstanceClass) { /** */ } }
        scope.InstanceClass = InstanceClass;
        expect(() => i.GetInstance(InstanceClass)).to.throw();
    });

    it("Should set and return instance from cache", () => {
        const i = new Injector();
        @Injectable(i)
        class InstanceClass { constructor() { /** */ } }

        const instance = new InstanceClass();

        i.SetInstance(instance);
        expect(i.GetInstance(InstanceClass)).to.be.eq(instance);
    });

    it("Should resolve a service from the scope", () => {
        const scope: any = {};
        class Service { }
        scope.Service = Service;
        const i = new Injector({scope});
        @Injectable(i)
        class InstanceClass { constructor(public service: Service) { /** */ } }
        scope.InstanceClass = InstanceClass;
        const instance = i.GetInstance(InstanceClass);
        expect(instance.service).to.be.instanceof(Service);
        // tslint:disable-next-line:no-string-literal
        expect(i["cachedSingletons"].has(Service.name));
    });

    it("Should resolve recoursively from the global scope", () => {
        const childScope: any = {};
        const parentScope: any = {};
        class Service { }
        parentScope.Service = Service;
        const parent = new Injector({scope: parentScope});
        const childI = new Injector({scope: childScope, parent});
        @Injectable(childI)
        class InstanceClass { constructor(public service: Service) { /** */ } }
        childScope.InstanceClass = InstanceClass;
        const instance = childI.GetInstance(InstanceClass);
        expect(instance.service).to.be.instanceof(Service);
        // tslint:disable-next-line:no-string-literal
        expect(childI["cachedSingletons"].has(Service.name));
    });
});
