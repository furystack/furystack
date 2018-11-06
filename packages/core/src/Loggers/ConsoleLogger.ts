import { ILeveledLogEntry, LogLevel } from "../Models/ILogEntries";
import { AbstractLogger } from "./AbstractLogger";

export const Reset = "\x1b[0m";

export const FgBlack = "\x1b[30m";
export const FgRed = "\x1b[31m";
export const FgGreen = "\x1b[32m";
export const FgYellow = "\x1b[33m";
export const FgBlue = "\x1b[34m";
export const FgMagenta = "\x1b[35m";
export const FgCyan = "\x1b[36m";
export const FgWhite = "\x1b[37m";

export class ConsoleLogger extends AbstractLogger {
    public async AddEntry<T>(entry: ILeveledLogEntry<T>) {
        let fontColor!: string;
        switch (entry.level) {
            case LogLevel.Verbose:
                fontColor = FgBlue;
                break;
            case LogLevel.Debug:
            case LogLevel.Information:
                fontColor = FgGreen;
                break;
            case LogLevel.Warning:
                fontColor = FgYellow;
                break;
            case LogLevel.Error:
            case LogLevel.Fatal:
                fontColor = FgRed;
                break;
        }
        // tslint:disable-next-line:no-console
        console.log(`${fontColor}%s${Reset}`, entry.scope, entry.message, entry.data);
    }

}
