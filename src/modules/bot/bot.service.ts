import { Injectable } from "@nestjs/common";
import * as puppeteer from "puppeteer";
import { join } from "path";
import { promises as fsPromises } from "fs";
import { Credentials } from "../../lib/types";

@Injectable()
export class BotService {
    private readonly credentialsPath: string = join(__dirname, "../../shared/credentials/credentials.json");

    constructor() {}

    async botRun(): Promise<void[]> {
        const credentialsJson = await fsPromises.readFile(this.credentialsPath, "utf8");
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

            const isLoggedIn = page.url() === "https://faucetearner.org/faucet.php";
            const resultMessage = isLoggedIn ? `Login successful for ${email}` : `Login failed for ${email}`;
            console.log(resultMessage);
        } catch (error) {
            console.error(`Error logging in for ${email}:`, error);
        } finally {
            await browser.close();
        }
    }
}
