import { Constructable, Injectable } from "@furystack/inject";
import { ContentType } from "./models";

@Injectable()
export class ContentDescriptorStore {
    public readonly ContentTypeDescriptors: Map<Constructable<any>, ContentType> = new Map();
}
