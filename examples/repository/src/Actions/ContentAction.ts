import { ElevatedRepository } from "@furystack/content-repository";
import { IRequestAction } from "@furystack/http-api";
import { Injectable } from "@furystack/inject";
import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";

@Injectable()
export class ContentAction implements IRequestAction {
    public dispose() { /**  */}

    private async getContent() {
        const parsedUrl = parse(this.incomingMessage.url as string, true);
        const contentId = parseInt(parsedUrl.query.contentId as string, 10);
        const aspectName = parsedUrl.query.aspectName as string;
        const content = await this.elevatedRepository.Load({
            ids: [contentId],
            aspectName,
        });
        this.serverResponse.writeHead(200, {
            "Content-Type": "application/json",
        });
        this.serverResponse.end(JSON.stringify(content[0]));

    }

    public async exec(): Promise<void> {
        switch (this.incomingMessage.method) {
            case "GET": {
                return this.getContent();
            }
            default: {
                throw Error(`Method '${this.incomingMessage.method}' not supported for this action`);
            }
        }
    }
    /**
     *
     */
    constructor(private serverResponse: ServerResponse, private incomingMessage: IncomingMessage, private elevatedRepository: ElevatedRepository) {

    }
}
