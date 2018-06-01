import { LoggerCollection } from "../Loggers";

export interface IService {
    loggers: LoggerCollection;
    readonly isRunning: boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
}
