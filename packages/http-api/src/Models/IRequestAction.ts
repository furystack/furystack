import { Disposable } from "@sensenet/client-utils";

export interface IRequestAction extends Disposable {
  exec(): Promise<void>;
}
