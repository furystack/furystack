import { expect } from "chai";
import { ConsoleLogger, LoggerCollection } from "../src/Loggers";
import { TestLogger } from "../src/Loggers/TestLogger";
import { LogLevel } from "../src/Models/ILogEntries";

export const loggersTests = describe("Loggers", () => {
    describe("LoggerCollection", () => {
        it("Should be constructed", () => {
            const loggers = new LoggerCollection();
            expect(loggers).to.be.instanceof(LoggerCollection);
        });

        it("Should forward Verbose event", (done) => {
            const loggers = new LoggerCollection();
            loggers.attachLogger(new TestLogger(async (e) => {
                expect(e.level).to.be.eq(LogLevel.Verbose);
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
                expect(e.level).to.be.eq(LogLevel.Debug);
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
                expect(e.level).to.be.eq(LogLevel.Information);
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
                expect(e.level).to.be.eq(LogLevel.Warning);
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
                expect(e.level).to.be.eq(LogLevel.Error);
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
                    expect(e.level).to.be.eq(LogLevel.Error);
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
                    expect(e.level).to.be.eq(LogLevel.Fatal);
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
                expect(e.level).to.be.eq(LogLevel.Fatal);
                done();
            }));
            loggers.Fatal({
                message: "alma",
                scope: "alma",
            });
        });

    });

    describe("ConsoleLogger", () => {
        const consoleLogger = new ConsoleLogger();
        it("Should print Verbose", () => consoleLogger.Verbose({ scope: "scope", message: "Example Verbose Message"}));
        it("Should print Debug", () => consoleLogger.Debug({ scope: "scope", message: "Example Debug Message"}));
        it("Should print Information", () => consoleLogger.Information({ scope: "scope", message: "Example Information Message"}));
        it("Should print Warning", () => consoleLogger.Warning({ scope: "scope", message: "Example Warning Message"}));
        it("Should print Error", () => consoleLogger.Error({ scope: "scope", message: "Example Error Message"}));
        it("Should print Fatal", () => consoleLogger.Fatal({ scope: "scope", message: "Example Fatal Message"}));
    });
});
