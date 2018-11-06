import { ILoggerOptions } from "../Models";
import { ILeveledLogEntry, LogLevel } from "../Models/ILogEntries";
import { AbstractLogger, defaultLoggerOptions } from "./AbstractLogger";

export const Reset = "\x1b[0m";

export const FgBlack = "\x1b[30m";
export const FgRed = "\x1b[31m";
export const FgGreen = "\x1b[32m";
export const FgYellow = "\x1b[33m";
export const FgBlue = "\x1b[34m";
export const FgMagenta = "\x1b[35m";
export const FgCyan = "\x1b[36m";
export const FgWhite = "\x1b[37m";

export const getLevelColor = (level: LogLevel) => {
    switch (level) {
        case LogLevel.Verbose:
        case LogLevel.Debug:
            return FgBlue;
        case LogLevel.Information:
            return FgGreen;
        case LogLevel.Warning:
            return FgYellow;
        case LogLevel.Error:
        case LogLevel.Fatal:
            return FgRed;
    }
};

export const defaultFormatter = <T>(entry: ILeveledLogEntry<T>) => {
    const fontColor = getLevelColor(entry.level);
    return [`${fontColor}%s${Reset}`, entry.scope, entry.message];
};

export const verboseFormatter = <T>(entry: ILeveledLogEntry<T>) => {
    const fontColor = getLevelColor(entry.level);

    return entry.data ?
    [`${fontColor}%s${Reset}`, entry.scope, entry.message, entry.data]
    :
    [`${fontColor}%s${Reset}`, entry.scope, entry.message];
};

export interface IConsoleLoggerOptions extends ILoggerOptions {
    formatter: <T>(entry: ILeveledLogEntry<T>) => any[];
}

export class ConsoleLogger extends AbstractLogger<IConsoleLoggerOptions> {

    public readonly options: IConsoleLoggerOptions;

    /**
     *
     */
    constructor(options?: Partial<IConsoleLoggerOptions> ) {
        super(options);
        this.options = {
            ...defaultLoggerOptions,
            ...{
                formatter: defaultFormatter,
            },
            ...options,
        };
    }

    public async AddEntry<T>(entry: ILeveledLogEntry<T>) {
        const data = this.options.formatter(entry);
        // tslint:disable-next-line:no-console
        console.log(...data);
    }

}
