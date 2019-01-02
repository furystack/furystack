import { LoggerCollection } from "@furystack/core";
import { Injectable, Injector } from "@furystack/inject";
import { AspectManager } from "./AspectManager";
import { User } from "./ContentTypes";
import { ElevatedUserContext } from "./ElevatedUserContext";
import { ISavedContent } from "./models";
import { Repository } from "./Repository";
import { RoleManager } from "./RoleManager";
import { SystemContent } from "./SystemContent";

@Injectable()
export class ElevatedRepository extends Repository {
    constructor(
        protected readonly logger: LoggerCollection,
        protected readonly aspectManager: AspectManager,
        protected readonly systemContent: SystemContent,
        protected readonly injector: Injector,
        protected readonly roleManager: RoleManager) {
        super(logger, aspectManager, systemContent, injector, roleManager, injector.GetInstance<ElevatedUserContext<ISavedContent<User>>>(ElevatedUserContext, true));
    }
}
