import { IncomingMessage } from "http";

export class Utils {
    public static async readPostBody<T>(incomingMessage: IncomingMessage): Promise<T> {
        let body = "";
        await new Promise((resolve, reject) => {
            incomingMessage.on("readable", () => {
                const data = incomingMessage.read();
                if (data) {
                    body += data;
                }
            });
            incomingMessage.on("end", () => {
                resolve();
            });
            incomingMessage.on("error", (err) => {
                reject(err);
            });
        });
        return JSON.parse(body) as T;
    }
}
