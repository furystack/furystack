import {ILeveledLogEntry, ILogEntry} from "./ILogEntries";
export interface ILogger {
    AddEntry: <T>(entry: ILeveledLogEntry<T>) => Promise<void>;
    Verbose: <T>(entry: ILogEntry<T>) => Promise<void>;
    Debug: <T>(entry: ILogEntry<T>) => Promise<void>;
    Information: <T>(entry: ILogEntry<T>) => Promise<void>;
    Warning: <T>(entry: ILogEntry<T>) => Promise<void>;
    Error: <T>(entry: ILogEntry<T>) => Promise<void>;
    Fatal: <T>(entry: ILogEntry<T>) => Promise<void>;
}
