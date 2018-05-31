import { IDisposable } from "@sensenet/client-utils";

export interface IActivateable extends IDisposable {
    activate: () => Promise<void>;
}
