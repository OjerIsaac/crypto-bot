import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotController } from "./bot.controller";

@Module({
    imports: [],
    controllers: [BotController],
    providers: [BotService],
    exports: [],
})
export class BotModule {}
