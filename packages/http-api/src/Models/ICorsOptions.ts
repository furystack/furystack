export interface ICorsOptions {
    origins: string[];
    methods?: Array<"POST" | "GET" | "PUT" | "DELETE">;
    headers?: string[];
    credentials?: boolean;
}
