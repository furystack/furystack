import { IDisposable } from "@sensenet/client-utils";

export interface IRequestAction extends IDisposable {
    exec(): Promise<void>;
}
