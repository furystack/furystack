import { Constructable, Injectable } from "@furystack/inject";
import { EntityManager, In } from "typeorm";
import { IContentTypeDecoratorOptions } from "./Decorators/ContentType";
import { DefaultAspects } from "./DefaultAspects";
import { Aspect, ContentType, FieldType, ReferenceType } from "./models";

@Injectable()
export class ContentDescriptorStore {

    public readonly ContentTypeDescriptors: Map<Constructable<any>, IContentTypeDecoratorOptions> = new Map();

    private async mapFieldTypesFromDescriptor(contentDescriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const contentType = await manager.findOne(ContentType, {
            where: {
                Name: contentDescriptor.Name,
            },
        });
        if (!contentType) {
            throw Error(`Content type '${contentDescriptor.Name}' not found!`);
        }
        return Array.from(contentDescriptor.Fields.entries()).map((d) => {
            const [fieldName, fieldDescriptor] = d;
            return manager.create(FieldType, {
                Name: fieldName,
                DisplayName: fieldDescriptor.DisplayName,
                Category: fieldDescriptor.Category,
                Description: fieldDescriptor.Description,
                DefaultValue: fieldDescriptor.DefaultValue,
                Unique: fieldDescriptor.Unique,
                ContentType: contentType.Id as any,
            });
        });
    }

    private async mapReferenceTypesFromDescriptorEntry(contentDescriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const contentType = await manager.findOne(ContentType, {
            where: {
                Name: contentDescriptor.Name,
            },
        });
        if (!contentType) {
            throw Error(`Content type '${contentDescriptor.Name}' not found!`);
        }
        return await Promise.all(Array.from(contentDescriptor.References.entries()).map(async (r) => {
            const [refName, refDescriptor] = r;
            const allowedTypes = await manager.find(ContentType, {
                where: {
                    Name: In(refDescriptor.AllowedTypes.map((ctor) => ctor.name)),
                },
            });
            return {
                Name: refName,
                DisplayName: refDescriptor.DisplayName,
                Category: refDescriptor.Category,
                AllowMultiple: refDescriptor.AllowMultiple,
                ContentType: contentType.Id as any,
                Description: refDescriptor.Description,
                AllowedTypes: allowedTypes.map((t) => t.Id) as any,
            } as ReferenceType;
        }));
    }

    private mapAspectsFromContentTypeDescriptor(contentDescriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const aspectNames = new Set<string>([...Object.keys(DefaultAspects)]);
        contentDescriptor.Fields.forEach((f) => {
            const keys = f.Aspects && Object.keys(f.Aspects) || [];
            keys.forEach((k) => aspectNames.add(k));
        });
        contentDescriptor.References.forEach((r) => {
            const keys = r.Aspects && Object.keys(r.Aspects) || [];
            keys.forEach((k) => aspectNames.add(k));
        });
        return Array.from(aspectNames).map((a) => ({ Name: a } as Aspect));
    }

    public async getContentTypes(manager: EntityManager) {
        const types: ContentType[] = [];
        for (const entry of this.ContentTypeDescriptors.entries()) {
            const ctd = await this.GetContentType({
                Name: entry[0].name,
                ...entry[1],
            }, manager);
            types.push(ctd);
        }
        return types;
    }

    public async GetContentType(descriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const contentType = manager.create(ContentType, {
            Name: descriptor.Name,
            DisplayName: descriptor.DisplayName,
            Category: descriptor.Category,
            Description: descriptor.Description,
        } as ContentType);

        Object.defineProperty(contentType, "FieldTypes", {
            get: () => this.mapFieldTypesFromDescriptor(descriptor, manager),
        });
        Object.defineProperty(contentType, "ReferenceTypes", {
            get: () => this.mapReferenceTypesFromDescriptorEntry(descriptor, manager),
        });
        Object.defineProperty(contentType, "Aspects", {
            get: () => this.mapAspectsFromContentTypeDescriptor(descriptor, manager),
        });
        return contentType;
    }

}
