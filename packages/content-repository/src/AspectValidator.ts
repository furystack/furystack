import { Injectable } from "@furystack/inject";
import { IAspect } from "./models";

@Injectable()
export class AspectValidator {
    public ValidateAspect<T>(originalEntity: T, change: Partial<T>, aspect: IAspect<T>) {
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
