import { ILogger } from "../Models/ILogger";

// tslint:disable:no-empty
export class BypassLogger implements ILogger {
    public error(...args: any[]) {
    }

    public warn(...args: any[]) {
    }

    public trace(...args: any[]) {
    }
}
