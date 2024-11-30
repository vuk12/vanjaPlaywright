import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class RegisterOrLoginPage extends BasePage {
    readonly emailInput: Locator;
    readonly submitButton: Locator;

    constructor(page: Page, path = "/account/register-or-login") {
        super(page, path);

        this.emailInput = page.getByTestId("email-input");
        this.submitButton = page.getByTestId("submit-btn");
    }

    async fillEmail(email: string, page: Page) {
        await this.emailInput.fill(email);
        await page.waitForTimeout(500);
    }

    async checkErrorMessageDisplayed() {
        await this.submitButton.click();
        await expect(this.errorMessageText).toBeVisible();
    }

    async completeRegisterOrLoginPage(testEmail:string, page:Page){
        await this.fillEmail(testEmail, page);
        await expect(this.errorMessageText).not.toBeVisible();
        await this.submitButton.click();
    }
}
