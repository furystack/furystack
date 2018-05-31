import { IActivateable } from "./Models/IActivateable";

export class ActivateableCollection<T extends IActivateable = IActivateable> implements Iterator<IActivateable>, IActivateable {

    public items: T[] = [];
    private pointer = 0;

    private isActivated: boolean = false;
    private isDisposing: boolean = false;

    constructor(...args: T[]) {
        this.items = args;
    }

    public next(): IteratorResult<T> {
        if (this.pointer < this.items.length) {
            return {
                done: false,
                value: this.items[this.pointer++],
            };
        } else {
            return {
                done: true,
                value: undefined as any,
            };
        }
    }
    public [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    public async dispose() {
        if (this.isDisposing) {
            throw Error("Already disposed.");
        } else {
            this.isDisposing = true;
            await Promise.all(this.items.map((item) => item.dispose()));
        }
    }

    public async activate() {
        if (this.isActivated) {
            throw Error("Already activated.");
        }

        if (this.isDisposing) {
            throw Error("Cannot activated, collection is disposed.");
        }
        this.isActivated = true;
        await Promise.all(this.items.map((item) => item.activate()));
    }
}
