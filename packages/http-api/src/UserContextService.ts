import { IUser } from "@furystack/core";
import {Injectable} from "@furystack/inject";
import { IncomingMessage } from "http";
import { IdentityService } from "./IdentityService";

@Injectable()
export class UserContextService {
    private user?: IUser;
    public async getCurrentUser() {
        if (!this.user) {
            this.user = await this.identityService.authenticateRequest(this.incomingMessage);
        }
        return this.user;
    }
    constructor(private identityService: IdentityService, private incomingMessage: IncomingMessage) {
    }
}
