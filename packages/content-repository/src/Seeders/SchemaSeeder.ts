import { LoggerCollection } from "@furystack/core";
import { Constructable, Injectable, Injector } from "@furystack/inject";
import { DeepPartial, EntityManager, FindOneOptions } from "typeorm";
import { ContentDescriptorStore } from "../ContentDescriptorStore";
import { ElevatedRepository } from "../ElevatedRepository";
import { ContentType } from "../models";

export interface ISeedEntry<T> {
    model: Constructable<T>;
    findOption: FindOneOptions<T>;
    instance: DeepPartial<T>;
}

@Injectable()
export class SchemaSeeder {

    public readonly LogScope = "@furystack/content-repository/seeder";
    private get logger(): LoggerCollection {
        return this.injector.GetInstance(LoggerCollection);
    }

    private async ensureExists<T>(entry: ISeedEntry<T>, manager: EntityManager) {
        const found = await manager.findOne(entry.model, entry.findOption);
        if (!found) {
            this.logger.Debug({
                scope: this.LogScope,
                message: `Entity '${JSON.stringify(entry.findOption)}' not found, creating...`,
                data: { instance: entry.instance },
            });
            try {
                const created = await manager.create(entry.model, entry.instance);
                return await manager.save(created);
            } catch (error) {
                throw error;
            }
        }
        return found;
    }

    constructor(private readonly repository: ElevatedRepository, private readonly injector: Injector) {

    }

    public async SeedBuiltinEntries() {
        await this.repository.activate();
        const log = <T>(message: string, data?: T) => this.logger.Debug({
            scope: this.LogScope,
            message,
            data,
        });

        const store = Injector.Default.GetInstance(ContentDescriptorStore);
        const manager = this.repository.GetManager();
        log("Seeding built-in entries...");

        await manager.transaction(async (tm) => {
            const cts = store.ContentTypeDescriptors.entries();
            for (const [, contentType] of cts) {
                await this.ensureExists({
                    model: ContentType,
                    findOption: {
                        where: {
                            Name: contentType.Name,
                        },
                    },
                    instance: contentType,
                }, tm);
            }
        });
    }
}
