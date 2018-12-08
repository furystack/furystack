import { ElevatedRepository } from "@furystack/content-repository";
import { Injectable } from "@furystack/inject";
import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { IRequestAction } from "../../../packages/http-api/dist";

@Injectable()
export class GetContent implements IRequestAction {
    public dispose() { /**  */}
    public async exec(): Promise<void> {
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
    /**
     *
     */
    constructor(private serverResponse: ServerResponse, private incomingMessage: IncomingMessage, private elevatedRepository: ElevatedRepository) {

    }
}
