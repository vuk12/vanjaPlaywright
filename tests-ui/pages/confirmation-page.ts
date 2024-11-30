import { BasePage } from "./base-page";
import { Page, Locator, expect } from "@playwright/test";

export class ConfirmationPage extends BasePage {
    readonly confirmationCodeText: Locator;
    readonly emailText: Locator;
    readonly goToHomepageButton: Locator;

    constructor(page: Page, path = "/order/confirmation") {
        super(page, path);
        this.confirmationCodeText = page.getByTestId("confirmation-orderNumber");
        this.emailText = page.getByTestId("confirmation-email");
        this.goToHomepageButton = page.getByTestId("button-gotoWebsite");
    }

    async verifyConfirmationCodeIsVisible() {
        await expect(this.confirmationCodeText).toBeVisible({ timeout: 30000 });
    }

    async verifyEmail(email: string) {
        await expect(this.emailText).toHaveText(email);
    }
}
