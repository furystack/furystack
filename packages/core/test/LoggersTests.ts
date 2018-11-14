import { ConsoleLogger, defaultFormatter, LoggerCollection, verboseFormatter } from "../src/Loggers";
import { TestLogger } from "../src/Loggers/TestLogger";
import { LogLevel } from "../src/Models/ILogEntries";

export const loggersTests = describe("Loggers", () => {
    describe("LoggerCollection", () => {
        it("Should be constructed", () => {
            const loggers = new LoggerCollection();
            expect(loggers).toBeInstanceOf(LoggerCollection);
        });

        it("Should forward Verbose event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Verbose);
                done();
            }));
            loggers.Verbose({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should forward Debug event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Debug);
                done();
            }));
            loggers.Debug({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should forward Information event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Information);
                done();
            }));
            loggers.Information({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should forward Warning event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Warning);
                done();
            }));
            loggers.Warning({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should forward Error event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Error);
                done();
            }));
            loggers.Error({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should raise an Error event if failed to insert below Error", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                if (e.level < LogLevel.Error) {
                    throw new Error("Nooo");
                } else {
                    expect(e.level).toBe(LogLevel.Error);
                    done();
                }
            }));
            loggers.Verbose({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should raise a Fatal event if failed to insert an Error", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                if (e.level < LogLevel.Fatal) {
                    throw new Error("Nooo");
                } else {
                    expect(e.level).toBe(LogLevel.Fatal);
                    done();
                }
            }));
            loggers.Verbose({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should forward Fatal event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Fatal);
                done();
            }));
            loggers.Fatal({
                message: "alma",
                scope: "alma",
            });
        });

        it("Should skip filtered events in a simple logger", (done) => {
            const logger = new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Error);
                done();
            }, {
                    filter: (ev) => ev.level === LogLevel.Error,
                });
            logger.Verbose({
                message: "alma",
                scope: "alma",
            });
            logger.Error({
                message: "alma",
                scope: "alma",
            });

        });

        it("Should skip filtered events in a collection", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).toBe(LogLevel.Error);
                done();
            }, {
                    filter: (ev) => ev.level === LogLevel.Error,
                }));
            loggers.Verbose({
                message: "alma",
                scope: "alma",
            });
            loggers.Error({
                message: "alma",
                scope: "alma",
            });

        });

    });

    describe("ConsoleLogger", () => {
        const consoleLogger = new ConsoleLogger();
        it("Should print Verbose", () => consoleLogger.Verbose({ scope: "scope", message: "Example Verbose Message" }));
        it("Should print Debug", () => consoleLogger.Debug({ scope: "scope", message: "Example Debug Message" }));
        it("Should print Information", () => consoleLogger.Information({ scope: "scope", message: "Example Information Message" }));
        it("Should print Warning", () => consoleLogger.Warning({ scope: "scope", message: "Example Warning Message" }));
        it("Should print Error", () => consoleLogger.Error({ scope: "scope", message: "Example Error Message" }));
        it("Should print Fatal", () => consoleLogger.Fatal({ scope: "scope", message: "Example Fatal Message" }));

        it("Should print additional data", () => consoleLogger.Fatal({ scope: "scope", message: "Example Fatal Message", data: { a: 1 } }));
    });

    describe("defaultFormatter", () => {
        it("Should print compact messages", () => expect(defaultFormatter({
            level: LogLevel.Debug,
            scope: "scope",
            message: "message",
            data: {},
        })).toEqual(["\u001b[34m%s\u001b[0m", "scope", "message"]));
    });

    describe("verboseFormatter", () => {
        it("Should print compact messages", () => expect(verboseFormatter({
            level: LogLevel.Debug,
            scope: "scope",
            message: "message",
        })).toEqual(["\u001b[34m%s\u001b[0m", "scope", "message"]));

        it("Should print verbose messages with data", () => expect(verboseFormatter({
            level: LogLevel.Debug,
            scope: "scope",
            message: "message",
            data: {},
        })).toEqual(["\u001b[34m%s\u001b[0m", "scope", "message", {}]));
    });

});
