import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
// import { Cron, CronExpression } from "@nestjs/schedule";
import { join } from "path";
import { readFileSync, appendFileSync } from "fs";
import { Credentials } from "../../lib/types";

@Injectable()
export class BotService {
    private readonly credentialsPath: string = join(process.cwd(), "src/shared/credentials/credentials.json");
    private readonly errorLogPath: string = join(process.cwd(), "src/shared/credentials/error.txt");
    private readonly successLogPath: string = join(process.cwd(), "src/shared/credentials/success.txt");
    constructor() {}

    // @Cron(CronExpression.EVERY_MINUTE)
    async onApplicationBootstrap() {
        // async botRun(): Promise<void[]> {
        const credentialsJson = readFileSync(this.credentialsPath, "utf8");
        const credentials: Credentials[] = JSON.parse(credentialsJson);

        const botPromises = credentials.map(async (credential) => this.loginWithCredentials(credential));
        return Promise.all(botPromises);
    }

    private async loginWithCredentials({ email, password }: Credentials): Promise<void> {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/chromium-browser",
            args: ["--no-sandbox"],
        });
        const page = await browser.newPage();

        try {
            await page.goto("https://faucetearner.org/login.php");
            await page.type('input[name="email"]', email);
            await page.type('input[name="password"]', password);
            await page.click(".reqbtn.btn-submit.w-100");

            await page.waitForNavigation({ waitUntil: "domcontentloaded" });
            console.log(`Login successful for ${email}`);

            if (page.url() === "https://faucetearner.org/faucet.php") {
                const h4Text = await page.$eval("h4.text-center.fw-bold.pb-3", (h4) => h4.textContent);
                console.log(`Fetched h4 text: ${h4Text}`);
            } else {
                await this.logMessage(`Error log for ${email} - Login failed`, this.successLogPath);
            }

            // Set up an interval to click the "Claim Now" button every 45sec for 12 hours
            const durationInHours = 60;
            const intervalId = setInterval(async () => {
                await page.click("button.m-auto.mt-2.reqbtn.btn.solid_btn.text-white.d-flex.align-items-center");

                // Introduce a delay (e.g., 10 seconds) to ensure the modal is fully rendered
                await new Promise((resolve) => setTimeout(resolve, 10000));

                console.log(`Success log for ${email} - Claim action completed`);

                await this.logMessage(`Success log for ${email} - Claim action completed`, this.successLogPath);
            }, 45 * 1000);

            // Wait for the specified duration before closing the loop
            await new Promise((resolve) => setTimeout(resolve, durationInHours * 60 * 60 * 1000));

            // Clear the interval after the specified waiting period
            clearInterval(intervalId);
        } catch (error) {
            await this.logMessage(`Error log for ${email} - ${error}`, this.errorLogPath);
        } finally {
            // await browser.close();
        }
    }

    private async logMessage(message: string, logFilePath: string): Promise<void> {
        const logEntry = `${new Date().toLocaleString()}: ${message}\n`;
        appendFileSync(logFilePath, `${logEntry}`, "utf-8");
    }
}
