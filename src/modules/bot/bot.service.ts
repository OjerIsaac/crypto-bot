import { Injectable } from "@nestjs/common";

@Injectable()
export class BotService {
    constructor() {}

    async botRun() {
        return "id";
    }
}
