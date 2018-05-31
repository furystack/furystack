export interface ILogger {
    error(scope: string, ...args: any[]): void;
    warn(scope: string, ...args: any[]): void;

    trace(scope: string, ...args: any[]): void;
}
