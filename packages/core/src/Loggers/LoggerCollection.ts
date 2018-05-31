import { ILogger } from "../Models/ILogger";

export class LoggerCollection implements ILogger {

    private loggers: ILogger[] = [];
    public attachLogger(logger: ILogger) {
        this.loggers.push(logger);
    }

    public error(scope: string, ...args: any[]) {
        for (const logger of this.loggers) {
            logger.error(scope, ...args);
        }
    }

    public warn(scope: string, ...args: any[]) {
        for (const logger of this.loggers) {
            logger.warn(scope, ...args);
        }
    }

    public trace(scope: string, ...args: any[]) {
        for (const logger of this.loggers) {
            logger.trace(scope, ...args);
        }
    }
}
