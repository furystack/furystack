import { expect } from "chai";
import { readFile as nodeReadFile, writeFile as nodeWriteFile } from "fs";
import { FileStore } from "../src/FileStore";
import { ILogger } from "../src/models/ILogger";

// tslint:disable:no-string-literal

const mockReadFile: (name: string, done: (err?: any) => void) => void = (_name, callback) => {
    callback();
};

const mockWriteFile: (name: string, value: any, done: (err?: any) => void) => void = (_name, _value, callback) => {
    callback();
};

export const fileStoreTests = describe("FileStore", () => {

    let f!: FileStore<{ id: number, value: string }>;

    beforeEach(() => {
        f = new FileStore<{ id: number, value: string }>("example.txt", "id", 1000, mockReadFile as any, mockWriteFile as any);
    });

    afterEach(() => {
        f.dispose();
    });

    it("should be constructed with default parameters", () => {
        const f2 = new FileStore<{ id: number, value: string }>("example.txt", "id");
        expect(f2).to.be.instanceof(FileStore);
        expect(f2["tickMs"]).to.be.eq(10000);
        expect(f2["readFile"]).to.be.eq(nodeReadFile);
        expect(f2["writeFile"]).to.be.eq(nodeWriteFile);
        clearInterval(f2["tick"]);
    });

    it("Update should set a value", async () => {
        await f.update(1, { id: 1, value: "asd" });
        const count = await f.count();
        expect(count).to.be.eq(1);
        const persisted = await f.get(1);
        expect(persisted).to.be.deep.eq({ id: 1, value: "asd" });
    });

    it("save should be triggered after change", (done: MochaDone) => {
        f["writeFile"] = ((_name: string, _value: any, callback: () => void) => {
            callback();
            done();
        }) as any;
        f.update(1, { id: 1, value: "asd" });
    });

    it("filter should return the corresponding entries", async () => {
        f.update(1, { id: 1, value: "asd" });
        f.update(2, { id: 2, value: "def" });
        f.update(3, { id: 3, value: "def" });

        const result = await f.filter({ value: "def" });
        expect(result.length).to.be.eq(2);
    });

    it("reload should fill the cache from the response", async () => {
        f["readFile"] = ((_name: string, callback: (_err: any, data: string) => void) => {
            callback(undefined, JSON.stringify([{ id: 1, value: "asd" }]));
        }) as any;

        await f.reloadData();
        const count = await f.count();
        expect(count).to.be.eq(1);
        const persisted = await f.get(1);
        expect(persisted).to.be.deep.eq({ id: 1, value: "asd" });
    });

    it("saveChanges should skip file writing on no changes", () => {
        f["hasChanges"] = false;
        f["writeFile"] = ((_name: string, _value: any, _callback: (err: any) => void) => { throw Error("Shouldn't be triggered on no change!"); }) as any;
        f["saveChanges"]();
    });

    it("saveChanges fail should add a log event", async () => {
        f["writeFile"] = ((_name: string, _value: any, callback: (err: any) => void) => {
            callback("Error during file write");
        }) as any;
        await new Promise((resolve, reject) => {
            f.logger.attachLogger({
                error: () => resolve(),
                trace: () => undefined,
                warn: () => undefined,
            } as ILogger);
            f["hasChanges"] = true;
            f["saveChanges"]();
        });
    });

    it("reloadData fail should add a log event", async () => {
        f["readFile"] = ((_name: string, callback: (_err: any, data: string) => void) => {
            callback("Error reading file", "");
        }) as any;
        await new Promise((resolve, reject) => {
            f.logger.attachLogger({
                error: () => resolve(),
                trace: () => undefined,
                warn: () => undefined,
            } as ILogger);
            f["reloadData"]();
        });
    });
});
