import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import { Cron, CronExpression } from "@nestjs/schedule";
import { join } from "path";
import { readFileSync, appendFileSync } from "fs";
import { Credentials } from "../../lib/types";

@Injectable()
export class BotService {
    private readonly credentialsPath: string = join(process.cwd(), "src/shared/credentials/credentials.json");
    private readonly errorLogPath: string = join(process.cwd(), "src/shared/credentials/error.txt");
    private readonly successLogPath: string = join(process.cwd(), "src/shared/credentials/success.txt");
    constructor() {}

    @Cron(CronExpression.EVERY_MINUTE)
    async botRun(): Promise<void[]> {
        const credentialsJson = readFileSync(this.credentialsPath, "utf8");
        const credentials: Credentials[] = JSON.parse(credentialsJson);

        const botPromises = credentials.map(async (credential) => this.loginWithCredentials(credential));
        return Promise.all(botPromises);
    }

    private async loginWithCredentials({ email, password }: Credentials): Promise<void> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        try {
            await page.goto("https://faucetearner.org/login.php");
            await page.type('input[name="email"]', email);
            await page.type('input[name="password"]', password);
            await page.click(".reqbtn.btn-submit.w-100");

            await page.waitForNavigation({ waitUntil: "domcontentloaded" });

            if (page.url() === "https://faucetearner.org/faucet.php") {
                // Click the "Claim Now" button
                await page.click(".reqbtn.btn.solid_btn");

                await this.logMessage(`Success log for ${email} - Action completed`, this.successLogPath);
            } else {
                await this.logMessage(`Error log for ${email} - Login failed`, this.errorLogPath);
            }
        } catch (error) {
            await this.logMessage(`Error log for ${email} - ${error}`, this.errorLogPath);
        } finally {
            await browser.close();
        }
    }

    private async logMessage(message: string, logFilePath: string): Promise<void> {
        const logEntry = `${new Date().toLocaleString()}: ${message}\n`;
        appendFileSync(logFilePath, `${logEntry}`, "utf-8");
    }
}
