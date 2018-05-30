import { ILogger } from "../Models/ILogger";

export class Logger implements ILogger {
    public error(...args: any[]) {
        const msgs: any[] = [`${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.error(...msgs);
    }

    public warn(...args: any[]) {
        const msgs: any[] = [`${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.warn(...msgs);
    }

    public trace(...args: any[]) {
        const msgs: any[] = [`${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.log(...msgs);
    }
}
