import { ContentRepositoryConfiguration, ContentSeeder, ElevatedRepository, ElevatedUserContext, SchemaSeeder, SystemContent, User } from "@furystack/content-repository";
import { ConsoleLogger, FuryStack, LoggerCollection } from "@furystack/core";
import { GetCurrentUser, HttpApi, HttpApiConfiguration, HttpAuthenticationSettings, NotFoundAction } from "@furystack/http-api";
import { Injector } from "@furystack/inject";
import { usingAsync} from "@sensenet/client-utils";
import { IncomingMessage, ServerResponse } from "http";
import { createServer } from "https";
import { parse } from "url";
import { ContentAction } from "./Actions/ContentAction";
import { FindContent } from "./Actions/FindContentAction";
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
        (msg) => {
            const urlPathName = parse(msg.url || "", true).pathname;
            switch (urlPathName) {
                case "/content": return ContentAction;
                case "/find": return FindContent;
                case "/currentUser": return GetCurrentUser;
            }
            return undefined;
        },
        // (msg) => (parse(msg.url || "", true).pathname === "/findContent") ? FindContent : undefined,

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
    await usingAsync(new Injector({parent: Injector.Default}), async (i) => {
        await usingAsync(ElevatedUserContext.Create(i), async () => {
            await i.GetInstance(SchemaSeeder, true).SeedBuiltinEntries();
            await i.GetInstance(ContentSeeder, true).SeedSystemContent();
        });

    });

    const repo = Injector.Default.GetInstance(ElevatedRepository);
    const systemContent = Injector.Default.GetInstance(SystemContent);
    Injector.Default.SetInstance(new HttpAuthenticationSettings({
        Users: repo.GetPhysicalStoreForType(User),
        VisitorUser: systemContent.VisitorUser,
    }));

    await stack.start();
})();
