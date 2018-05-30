export interface ILogger {
    error(...args: any[]): void;
    warn(...args: any[]): void;

    trace(...args: any[]): void;
}
