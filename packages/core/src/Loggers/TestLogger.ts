import { ILeveledLogEntry } from "../Models/ILogEntries";
import { AbstractLogger } from "./AbstractLogger";

export class TestLogger extends AbstractLogger {
    constructor(private readonly onAddEntry: <T>(entry: ILeveledLogEntry<T>) => Promise<void>) {
        super();
    }
    public async AddEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
        await this.onAddEntry(entry);
    }
}
