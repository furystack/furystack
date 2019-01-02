import { LoggerCollection } from "@furystack/core";
import { Injectable, Injector } from "@furystack/inject";
import { AspectManager } from "./AspectManager";
import { BaseRepository } from "./BaseRepository";
import { User } from "./ContentTypes";
import { ElevatedUserContext } from "./ElevatedUserContext";
import { ISavedContent } from "./models";
import { RoleManager } from "./RoleManager";
import { SystemContent } from "./SystemContent";

@Injectable()
export class ElevatedRepository extends BaseRepository {
    constructor(
        protected readonly logger: LoggerCollection,
        protected readonly aspectManager: AspectManager,
        protected readonly systemContent: SystemContent,
        protected readonly injector: Injector,
        protected readonly roleManager: RoleManager) {
        super(logger, aspectManager, systemContent, injector, roleManager, injector.GetInstance<ElevatedUserContext<ISavedContent<User>>>(ElevatedUserContext, true));
    }
}
