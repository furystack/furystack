export interface IAspectFieldType<T> {
    FieldName: keyof T;
    Required?: boolean;
    ReadOnly?: boolean;
    ControlHint?: string;
}

export interface IAspect<T> {
    DisplayName?: string;
    Description?: string;
    Fields?: {
        [K: number]: IAspectFieldType<T>,
    };
}
