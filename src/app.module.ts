import { HttpException, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { SentryInterceptor, SentryModule } from "@ntegral/nestjs-sentry";
import { AcceptLanguageResolver, HeaderResolver, I18nModule } from "nestjs-i18n";
import * as path from "path";
import { BotModule } from "./modules/bot";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, cache: true }),
        SentryModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                dsn: config.get("SENTRY_DSN"),
                debug: true,
                enabled: config.get("NODE_ENV") !== "test",
                environment: config.get("NODE_ENV"),
                release: config.get("APP_RELEASE"),
                logLevels: ["log", "error", "warn", "debug", "verbose"],
            }),
            inject: [ConfigService],
        }),
        I18nModule.forRoot({
            fallbackLanguage: "en",
            loaderOptions: {
                path: path.join(__dirname, "/i18n/"),
                watch: true,
            },
            resolvers: [new HeaderResolver(["x-lang"]), AcceptLanguageResolver],
        }),
        BotModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useFactory: () =>
                new SentryInterceptor({
                    filters: [
                        {
                            type: HttpException,
                            filter: (exception: HttpException) => 500 >= exception.getStatus(),
                        },
                    ],
                }),
        },
    ],
    exports: [],
})
export class AppModule {}
