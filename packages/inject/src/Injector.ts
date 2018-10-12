import { Constructable } from "./Types/Constructable";

export class Injector {

    public options: { parent: Injector, scope: any } = {
        parent: Injector.Default,
        scope: typeof global !== "undefined" ? global : typeof window !== undefined ? window : {},
    };

    public static Default: Injector = new Injector({ parent: undefined });
    public meta: Map<string, string[]> = new Map();

    private cachedSingletons: Map<string, any> = new Map();

    private getCtorFromName(ctorName: string) {
        const ctor = this.options.scope[ctorName];
        if (!ctor || typeof ctor !== "function") {
            throw Error(`Constructor not found in scope for '${ctorName}'`);
        }
        return ctor as Constructable<any>;
    }

    public GetInstance<T>(ctor: Constructable<T>) {
        return this.GetInstanceByName<T>(ctor.name, ctor);
    }

    public SetInstance<T>(instance: T, key: string = instance.constructor.name) {
        this.cachedSingletons.set(key, instance);
    }

    public GetInstanceByName<T>(ctorName: string, ctor?: Constructable<T>, deps: string[] = []): T {

        if (deps.includes(ctorName)) {
            throw Error(`Circular dependency when resolving '${ctorName}', dependency chain is: "${deps.join(" -> ")}"`);
        }

        if (this.cachedSingletons.has(ctorName)) {
            return this.cachedSingletons.get(ctorName) as T;
        }

        const fromParent = this.options.parent && this.options.parent.options.scope[ctorName] && this.options.parent.GetInstanceByName<T>(ctorName, ctor, deps);
        if (fromParent) {
            return fromParent;
        }

        if (!ctor) {
            ctor = this.getCtorFromName(ctorName);
        }

        const meta = this.meta.get(ctorName);
        if (!meta) {
            // no meta, create w/o arguments
            const instanceWoMeta = new ctor();
            this.cachedSingletons.set(ctorName, instanceWoMeta);
            return instanceWoMeta;
        }
        const argCtors: Array<Constructable<any>> = meta.map((arg) => this.GetInstanceByName(arg, undefined, [...deps, ctorName]));
        const instance = new ctor(...argCtors) as T;
        this.cachedSingletons.set(ctorName, instance);
        return instance;
    }

    constructor(options?: Partial<Injector["options"]>) {
        this.options = { ...this.options, ...options };
    }
}
