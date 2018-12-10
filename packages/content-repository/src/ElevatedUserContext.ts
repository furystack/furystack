import { IUser, UserContext } from "@furystack/core";
import { Injectable, Injector } from "@furystack/inject";
import { IDisposable } from "@sensenet/client-utils";
import { SystemContent } from "./SystemContent";

@Injectable()
export class ElevatedUserContext implements UserContext, IDisposable {

    private isDisposed: boolean = false;

    public dispose() {
        this.isDisposed = true;
    }

    public async getCurrentUser(): Promise<IUser> {
        if (!this.isDisposed) {
            return this.systemContent.AdminUser;
        }
        return await this.injector.options.parent.GetInstance(UserContext).getCurrentUser();
    }
    constructor(
        private readonly systemContent: SystemContent,
        private readonly injector: Injector,
        ) {
    }

}
