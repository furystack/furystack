import { Constructable, Injectable } from "@furystack/inject";
import { EntityManager, In } from "typeorm";
import { IContentTypeDecoratorOptions } from "./Decorators/ContentType";
import { IVisibilityOption } from "./Decorators/Field";
import { IReferenceVisibilityOption } from "./Decorators/Reference";
import { DefaultAspects } from "./DefaultAspects";
import { Aspect, AspectField, AspectReference, ContentType, FieldType, ReferenceType } from "./models";

@Injectable()
export class ContentDescriptorStore {

    public readonly ContentTypeDescriptors: Map<Constructable<any>, IContentTypeDecoratorOptions> = new Map();

    private async mapFieldTypesFromDescriptor(contentDescriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const contentType = await manager.findOneOrFail(ContentType, {
            where: {
                Name: contentDescriptor.Name,
            },
        });
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
        const contentType = await manager.findOneOrFail(ContentType, {
            where: {
                Name: contentDescriptor.Name,
            },
        });
        return await Promise.all(Array.from(contentDescriptor.References.entries()).map(async (r) => {
            const [refName, refDescriptor] = r;
            const allowedTypes = await manager.find(ContentType, {
                where: {
                    Name: In(refDescriptor.AllowedTypes.map((ctor) => ctor.name)),
                },
            });
            return manager.create(ReferenceType, {
                Name: refName,
                DisplayName: refDescriptor.DisplayName,
                Category: refDescriptor.Category,
                AllowMultiple: refDescriptor.AllowMultiple,
                ContentType: contentType.Id as any,
                Description: refDescriptor.Description,
                AllowedTypes: allowedTypes as any,
            } as ReferenceType);
        }));
    }

    public async mapAspectsFromContentTypeDescriptor(contentDescriptor: IContentTypeDecoratorOptions & { Name: string }, manager: EntityManager) {
        const contentType = await manager.findOneOrFail(ContentType, {
            where: {
                Name: contentDescriptor.Name,
            },
        });
        const aspectNames = new Set<string>([...Object.keys(DefaultAspects)]);
        const aspectFields = new Map<string, Array<Partial<AspectField>>>();
        const aspectReferences = new Map<string, Array<Partial<AspectReference>>>();
        const fieldTypes = await contentType.FieldTypes;
        const refTypes = await contentType.ReferenceTypes;

        contentDescriptor.Fields.forEach((f, fName) => {
            if (f.Aspects) {
                const keys = Object.keys(f.Aspects) || [];
                keys.forEach((k) => {
                    const a = (f.Aspects as any)[k] as IVisibilityOption;
                    aspectNames.add(k);
                    if (!aspectFields.has(k)) {
                        aspectFields.set(k, []);
                    }
                    const fieldType = fieldTypes.find((t) => t.Name === fName);
                    (aspectFields.get(k) as Array<Partial<AspectField>>).push({
                        FieldType: fieldType as any,
                        Required: a.Required,
                        ReadOnly: a.ReadOnly,
                        ControlName: a.ControlName || "",
                        Order: a.Order || 1,
                        Category: a.Category || "",
                    });
                });
            }
        });
        contentDescriptor.References.forEach((r, rName) => {
            if (r.Aspects) {
                const keys = Object.keys(r.Aspects) || [];
                keys.forEach((k) => {
                    aspectNames.add(k);
                    if (!aspectReferences.has(k)) {
                        aspectReferences.set(k, []);
                    }
                    const a = (r.Aspects as any)[k] as IReferenceVisibilityOption;
                    const refType = refTypes.find((ref) => ref.Name === rName);
                    (aspectReferences.get(k) as Array<Partial<AspectReference>>).push({
                        Category: a.Category,
                        ControlName: a.ControlName,
                        Order: a.Order,
                        ReadOnly: a.ReadOnly,
                        Required: a.Required,
                        ReferenceType: refType as any,
                    });
                });

            }
        });

        const aspects = Array.from(aspectNames).map((a) =>
            ({
                aspect: manager.create(Aspect, {
                    Name: a,
                    ContentType: contentType.Id as any,
                } as Aspect),
                AspectFields: aspectFields.get(a),
                AspectReferences: aspectReferences.get(a),
            }));
        return aspects;
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
