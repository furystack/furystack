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

    public async TransformPlainContent<T>(options: {content: Content, aspect: IAspect<T>, loadRef: (ids: number[]) => Promise<Array<ISavedContent<{}>>>}) {
        const {...content} = {...options.content};
        const createdObject: ISavedContent<T> = {
            ...JSON.parse(JSON.stringify(content)),
        } as ISavedContent<T>;

        for (const field of Object.values(options.aspect.Fields || [])) {
            const contentField = options.content.Fields.find((f) => f.Name === field.FieldName);
            const contentFieldType = options.content.Type.Fields && options.content.Type.Fields[field.FieldName as any];
            if (contentField && contentFieldType && contentField.Value) {
                if (contentFieldType.Type === "Value") {
                    createdObject[field.FieldName as keyof T] = contentField.Value as any;
                } else if (contentFieldType.Type === "Reference") {
                    const id = JSON.parse(contentField.Value) as number;
                    createdObject[field.FieldName as keyof T] = (await options.loadRef([id])) as any;
                } else if (contentFieldType.Type === "ReferenceList") {
                    const ids = JSON.parse(contentField.Value) as number[];
                    createdObject[field.FieldName as keyof T] = (await options.loadRef(ids)) as any;
                }
            }
        }
        return createdObject;
    }

    public Validate<T>(originalEntity: T, change: Partial<T>, aspect: IAspect<T>) {
        const missing = [];
        const readonly = [];
        if (aspect.Fields) {
            for (const aspectField of Object.values(aspect.Fields)) {
                const fieldName = aspectField.FieldName as any as (keyof typeof originalEntity & keyof typeof change);
                if (aspectField.ReadOnly && originalEntity[fieldName] !== change[fieldName]) {
                    readonly.push(fieldName);
                }
                if (aspectField.Required && !originalEntity[fieldName] && !change[fieldName] || change[fieldName] === null) {
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
