export interface IJob {
    DisplayName?: string;
    Description?: string;
    Category?: string;
    PrerequisiteJobNames?: string[];
    Completed?: boolean;
    Repeatable?: boolean;
}
