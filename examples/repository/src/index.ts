import { ContentRepositoryConfiguration, ContentSeeder, ElevatedRepository, SchemaSeeder, SystemContent, User } from "@furystack/content-repository";
import { ConsoleLogger, FuryStack, LoggerCollection } from "@furystack/core";
import { GetCurrentUser, HttpApi, HttpApiConfiguration, IdentityService, NotFoundAction } from "@furystack/http-api";
import { Injector } from "@furystack/inject";
import { IncomingMessage, ServerResponse } from "http";
import { createServer } from "https";
import { CertificateManager } from "./CertificateManager";

Injector.Default.SetInstance(new ContentRepositoryConfiguration({
    connection: {
        name: "@furystack/example-repository",
        type: "sqlite",
        database: "./db.sqlite",
        synchronize: true,
        logging: true,
    },
}));

Injector.Default.SetInstance(new HttpApiConfiguration({
    protocol: "https",
    port: 8443,
    corsOptions: {
        credentials: true,
        origins: ["http://localhost:8080"],
    },
    defaultAction: NotFoundAction,
    actions: [
        () => GetCurrentUser,
    ],
    serverFactory: (listener) => createServer(Injector.Default.GetInstance(CertificateManager).getCredentials(), (req: IncomingMessage, resp: ServerResponse) => listener(req, resp)),
}));

const loggers = new LoggerCollection();
loggers.attachLogger(new ConsoleLogger());
Injector.Default.SetInstance(loggers);

Injector.Default.SetInstance(new CertificateManager());

const stack = new FuryStack({
    apis: [HttpApi],
    injectorParent: Injector.Default,
});
(async () => {
    await Injector.Default.GetInstance(SchemaSeeder).SeedBuiltinEntries();
    await Injector.Default.GetInstance(ContentSeeder).SeedSystemContent();

    const repo = Injector.Default.GetInstance(ElevatedRepository);
    const systemContent = Injector.Default.GetInstance(SystemContent);
    Injector.Default.SetInstance(new IdentityService({
        users: repo.GetPhysicalStoreForType(User),
        visitorUser: systemContent.VisitorUser,
    }));

    await stack.start();
})();
