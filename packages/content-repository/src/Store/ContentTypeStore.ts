import { Injectable } from "@furystack/inject";
import { FindOneOptions } from "typeorm";
import { ContentType } from "../models";
import { AbstractStore } from "./AbstractStore";

@Injectable()
export class ContentTypeStore extends AbstractStore<ContentType> {
    protected getFindOptionFromItem(item: ContentType): FindOneOptions<ContentType> {
        return {
            where: {
                Name: item.Name,
            },
        };
    }

    protected getFindOptionFromKey(key: string): FindOneOptions<ContentType> {
        return {
            where: {
                Name: key,
            },
        };
    }
    protected getKeyFromItem(item: ContentType): string {
        return item.Name;
    }
    constructor() {
        super();
    }

}
