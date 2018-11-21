import { Injectable } from "@furystack/inject";
import { FindOneOptions, Repository } from "typeorm";
import { ContentType, ReferenceType } from "../models";
import { AbstractStore } from "./AbstractStore";

@Injectable()
export class ReferenceTypeStore extends AbstractStore<ReferenceType, number> {

    public async updateOnContentType(contentType: ContentType, value: ReferenceType, repository: Repository<ReferenceType>) {
        const existing = await repository.findOne({
            where: {
                Name: value.Name,
                ContentType: contentType.Id,
            },
        });
        let returnValue!: ReferenceType;
        if (!existing) {
            const saved = await repository.save(value as any);
            this.values.set(this.getKeyFromItem(value), saved);
            returnValue = saved;
        } else {
            const merged = repository.merge(existing, value as any);
            returnValue = await repository.save(merged as any);
            this.values.set(this.getKeyFromItem(value), returnValue);
        }

        const allowedTypes = await value.AllowedTypes;

        await repository.createQueryBuilder()
            .relation(ReferenceType, "AllowedTypes")
            .of(returnValue)
            .add(allowedTypes);

        return returnValue;
    }

    protected getFindOptionFromItem(item: ReferenceType): FindOneOptions<ReferenceType> {
        return {
            where: {
                Name: item.Name,
            },
        };
    }

    protected getFindOptionFromKey(key: number): FindOneOptions<ReferenceType> {
        return {
            where: {
                Name: key,
            },
        };
    }
    protected getKeyFromItem(item: ReferenceType): number {
        return item.Id;
    }
    constructor() {
        super();
    }

}
