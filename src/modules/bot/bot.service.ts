import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import { join } from "path";
import { readFileSync, appendFileSync } from "fs";
import { Credentials } from "../../lib/types";

@Injectable()
export class BotService {
    private readonly credentialsPath: string = join(process.cwd(), process.env.CREDENTIALS_PATH);
    private readonly errorLogPath: string = join(process.cwd(), process.env.ERROR_PATH);
    private readonly successLogPath: string = join(process.cwd(), process.env.SUCCESS_PATH);

    private browser: puppeteer.Browser | null = null;

    constructor() {}

    async onApplicationBootstrap() {
        try {
            // Create a single browser instance
            this.browser = await puppeteer.launch({ headless: true });

            const credentialsJson = readFileSync(this.credentialsPath, "utf8");
            const credentials: Credentials[] = JSON.parse(credentialsJson);

            const botPromises = credentials.map(async (credential) => this.loginWithCredentials(credential));
            return Promise.all(botPromises);
        } finally {
            // await this.browser.close();
        }
    }

    private async loginWithCredentials({ email, password }: Credentials): Promise<void> {
        if (!this.browser) {
            await this.logMessage("Browser instance not initialized.", this.errorLogPath);
        }

        const page = await this.browser.newPage();

        try {
            await page.goto("https://faucetearner.org/login.php", { timeout: 60000 });
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

            // Set up an interval to click the "Claim Now" button every 45sec
            const durationInHours = 36;
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
            await this.logMessage(`Error log for ${email} - ${error.stack}`, this.errorLogPath);
        }
    }

    private async logMessage(message: string, filePath: string): Promise<void> {
        const logEntry = `${new Date().toLocaleString()}: ${message}\n`;
        appendFileSync(filePath, `${logEntry}`, "utf-8");
    }
}
