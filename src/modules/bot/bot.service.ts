import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import { join } from "path";
import { readFileSync, appendFileSync } from "fs";
import { Credentials } from "../../lib/types";

@Injectable()
export class BotService {
    private readonly credentialsPath: string = join(process.cwd(), "src/shared/credentials/credentials.json");
    private readonly errorLogPath: string = join(process.cwd(), "src/shared/credentials/error.txt");
    constructor() {}

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

            page.url() === "https://faucetearner.org/faucet.php";

            const resultMessage = `Login successful for ${email}`;

            console.log(resultMessage);
        } catch (error) {
            await this.logError(`Error log for ${email} - ${error}`);
        } finally {
            await browser.close();
        }
    }

    private async logError(errorMessage: string): Promise<void> {
        try {
            const message = `${new Date().toLocaleString()}: ${errorMessage}`;
            appendFileSync(this.errorLogPath, `${message}\n`, "utf-8");
            console.log(`nnna is: ${message}`);
        } catch (error) {
            console.error(`Error writing to error log:`, error);
        }
    }
}
