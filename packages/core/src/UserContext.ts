import {Injectable} from "@furystack/inject";
import { IUser } from "./Models";

@Injectable()
export class UserContext<T extends IUser = IUser> {
    public async getCurrentUser(): Promise<T> {
        throw Error("The UserContext is not implemented");
    }
}
