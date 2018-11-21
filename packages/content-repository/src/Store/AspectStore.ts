import { Injectable } from "@furystack/inject";
import { FindOneOptions, Repository } from "typeorm";
import { Aspect, ContentType } from "../models";
import { AbstractStore } from "./AbstractStore";

@Injectable()
export class AspectStore extends AbstractStore<Aspect, number> {

    public async updateOnContentType(contentType: ContentType, value: Aspect, repository: Repository<Aspect>) {
        const existing = await repository.findOne({
            where: {
                Name: value.Name,
                ContentType: contentType.Id,
            },
        });
        if (!existing) {
            const saved = await repository.save(value as any);
            this.values.set(this.getKeyFromItem(value), saved);
            return saved;
        }
        const merged = repository.merge(existing, value as any);
        const updated = await repository.save(merged as any);
        this.values.set(this.getKeyFromItem(value), updated);
        return updated;
    }

    protected getFindOptionFromItem(item: Aspect): FindOneOptions<Aspect> {
        return {
            where: {
                Name: item.Name,
            },
        };
    }

    protected getFindOptionFromKey(key: number): FindOneOptions<Aspect> {
        return {
            where: {
                Name: key,
            },
        };
    }
    protected getKeyFromItem(item: Aspect): number {
        return item.Id;
    }
    constructor() {
        super();
    }

}
