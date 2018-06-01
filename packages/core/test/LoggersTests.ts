import { expect } from "chai";
import { Server } from "tls";
import { ConsoleLogger, LoggerCollection } from "../src/Loggers";
import { ILogger } from "../src/Models/ILogger";

export const loggersTests = describe("Loggers", () => {
    describe("LoggerCollection", () => {
        it("Should be constructed", () => {
            const loggers = new LoggerCollection();
            expect(loggers).to.be.instanceof(LoggerCollection);
        });

        it("Should forward trace event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger({
                trace: () => done(),
                error: () => undefined,
                warn: () => undefined,
            } as ILogger);

            loggers.trace("");
        });

        it("Should forward error event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger({
                trace: () => undefined,
                error: () => done(),
                warn: () => undefined,
            } as ILogger);

            loggers.error("");
        });

        it("Should forward warn event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger({
                trace: () => undefined,
                error: () => undefined,
                warn: () => done(),
            } as ILogger);

            loggers.warn("");
        });
    });

    describe("ConsoleLogger", () => {
        const consoleLogger = new ConsoleLogger();
        it("Should print traces", () => consoleLogger.trace("trace"));
        it("Should print warns", () => consoleLogger.warn("warn"));
        it("Should print errors", () => consoleLogger.error("error"));
    });
});
