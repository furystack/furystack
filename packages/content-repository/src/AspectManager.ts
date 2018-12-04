import { Injectable } from "@furystack/inject";
import { Content, IAspect, ISavedContent } from "./models";

@Injectable()
export class AspectManager {

    public GetAspect(content: Content, aspectName: string) {
        return content.Type.Aspects && content.Type.Aspects[aspectName];
    }

    public GetAspectOrFail(content: Content, aspectName: string) {
        const asp = this.GetAspect(content, aspectName);
        if (!asp) {
            throw Error(`Aspect '${aspectName}' not found for content type '${content.Type.Name}'`);
        }
        return asp;
    }

    public TransformPlainContent<T>(content: Content, aspect: IAspect<T>) {
        const createdObject: ISavedContent<T> = {
            Id: content.Id,
        } as ISavedContent<T>;

        for (const field of Object.values(aspect.Fields || [])) {
            const contentField = content.Fields.find((f) => f.Name === field.FieldName);
            createdObject[field.FieldName as keyof T] = contentField && contentField.Value as any;
        }
        return createdObject;
    }

    public Validate<T>(originalEntity: T, change: Partial<T>, aspect: IAspect<T>) {
        const missing = [];
        const readonly = [];
        if (aspect.Fields) {
            for (const aspectFieldName of Object.keys(aspect.Fields)) {
                const fieldName = aspectFieldName as any as (keyof typeof originalEntity & keyof typeof change);
                const aspectField = aspect.Fields[aspectFieldName as any];
                if (aspectField.ReadOnly && originalEntity[fieldName] !== change[fieldName]) {
                    readonly.push(fieldName);
                }
                if (aspectField.Required && !originalEntity[fieldName] && !change[fieldName]) {
                    missing.push(fieldName);
                }
            }
        }
        return {
            missing,
            readonly,
            isValid: missing.length + readonly.length ? false : true,
        };
    }
}
