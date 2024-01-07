import { Controller, Get, Res, HttpStatus } from "@nestjs/common";
import { BotService } from "./bot.service";
import { Response } from "express";

@Controller({ path: "bot", version: "1" })
export class BotController {
    constructor(private readonly botService: BotService) {}

    @Get()
    async botRun(@Res() res: Response) {
        const bot = await this.botService.botRun();

        return res.status(HttpStatus.OK).json({
            message: "records fetched successfully",
            data: bot,
            statusCode: HttpStatus.OK,
        });
    }
}
