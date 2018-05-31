import { ILogger } from "../Models/ILogger";

export class ConsoleLogger implements ILogger {
    public error(scope: string, ...args: any[]) {
        const msgs: any[] = [`${scope} >${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.error(...msgs);
    }

    public warn(scope: string, ...args: any[]) {
        const msgs: any[] = [`${scope} > ${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.warn(...msgs);
    }

    public trace(scope: string, ...args: any[]) {
        const msgs: any[] = [`${scope} >${new Date().toISOString()}: `, ...args];
        // tslint:disable-next-line:no-console
        console.log(...msgs);
    }
}
