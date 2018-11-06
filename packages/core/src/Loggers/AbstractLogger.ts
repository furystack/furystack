import { ILeveledLogEntry, ILogEntry, LogLevel } from "../Models/ILogEntries";
import { ILogger } from "../Models/ILogger";

export const AbstractLoggerScope = "@furystack/core/AbstractLogger";

export abstract class AbstractLogger implements ILogger {
    public abstract AddEntry<T>(entry: ILeveledLogEntry<T>): Promise<void>;
    private async addEntryInternal<T>(entry: ILeveledLogEntry<T>) {
        try {
            await this.AddEntry(entry);
        } catch (error) {
            this.Error({
                scope: AbstractLoggerScope,
                message: "There was an error adding entry to the log",
                data: {
                    entry,
                    error,
                },
            });
        }
    }
    public async Verbose<T>(entry: ILogEntry<T>) {
        await this.addEntryInternal({
            ...entry,
            level: LogLevel.Verbose,
        });
    }
    public async Debug<T>(entry: ILogEntry<T>) {
        await this.addEntryInternal({
            ...entry,
            level: LogLevel.Debug,
        });
    }
    public async Information<T>(entry: ILogEntry<T>) {
        await this.addEntryInternal({
            ...entry,
            level: LogLevel.Information,
        });
    }
    public async Warning<T>(entry: ILogEntry<T>) {
        await this.addEntryInternal({
            ...entry,
            level: LogLevel.Warning,
        });
    }
    public async Error<T>(entry: ILogEntry<T>) {
        try {
            await this.AddEntry({
                ...entry,
                level: LogLevel.Error,
            });
        } catch (error) {
            await this.Fatal({
                scope: AbstractLoggerScope,
                message: "There was an error persisting an Error event in the log and therefore the event was elevated to Fatal level.",
                data: {
                    originalEntry: entry,
                    error,
                },
            });
        }
    }
    public async Fatal<T>(entry: ILogEntry<T>) {
        await this.AddEntry({
            ...entry,
            level: LogLevel.Fatal,
        });
    }

}
