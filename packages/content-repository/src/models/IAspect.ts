export interface IAspect<T> {
    DisplayName?: string;
    Description?: string;
    Fields?: {
        [K: number]: {
            FieldName: keyof T;
            Required?: boolean;
            ReadOnly?: boolean;
            ControlHint?: string;
        },
    };
}
