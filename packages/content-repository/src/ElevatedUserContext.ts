import { IUser, UserContext } from "@furystack/core";
import { Injectable, Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { User } from "./ContentTypes";
import { SystemContent } from "./SystemContent";

@Injectable()
export class ElevatedUserContext<TUser extends IUser = User> implements UserContext<TUser>, IDisposable {

    private isDisposed: boolean = false;

    public dispose() {
        this.isDisposed = true;
    }

    public async GetCurrentUser(): Promise<TUser> {
        if (!this.isDisposed) {
            return this.systemContent.AdminUser as any as TUser;
        }
        return await this.injector.options.parent.GetInstance(UserContext).GetCurrentUser() as TUser;
    }
    constructor(
        private readonly systemContent: SystemContent,
        private readonly injector: Injector,
        ) {
    }

    public static Create<TUser extends IUser = User>(injector: Injector): ElevatedUserContext<TUser> {
        injector.Remove(ElevatedUserContext);
        const instance = injector.GetInstance<ElevatedUserContext<TUser>>(ElevatedUserContext, true);
        injector.SetInstance(instance, UserContext);
        return instance;
    }

}
