import { Injectable } from "@furystack/inject";
import { FindOneOptions, Repository } from "typeorm";
import { ContentType, FieldType } from "../models";
import { AbstractStore } from "./AbstractStore";

@Injectable()
export class FieldTypeStore extends AbstractStore<FieldType, number> {

    public async updateOnContentType(contentType: ContentType, value: FieldType, repository: Repository<FieldType>) {
        const existing = await repository.findOne({
            where: {
                Name: value.Name,
                ContentType: contentType,
            },
        });
        if (!existing) {
            const saved = await repository.save(value as any);
            this.values.set(this.getKeyFromItem(value), saved);
            return saved;
        }
        Object.assign(existing, value);
        // const merged = repository.merge(existing, value as any);
        const updated = await repository.save(existing as any);
        this.values.set(this.getKeyFromItem(value), updated);
        return updated;
    }

    protected getFindOptionFromItem(item: FieldType): FindOneOptions<FieldType> {
        return {
            where: {
                Name: item.Name,
            },
        };
    }

    protected getFindOptionFromKey(id: number): FindOneOptions<FieldType> {
        return {
            where: {
                Id: id,
            },
        };
    }
    protected getKeyFromItem(item: FieldType): number {
        return item.Id;
    }
    constructor() {
        super();
    }

}
