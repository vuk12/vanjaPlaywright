import { BasePage } from "./base-page";
import { Page, Locator, expect } from "@playwright/test";

export class StripePage extends BasePage {
    // Order details
    readonly totalPrice: Locator;
    readonly tax: Locator;

    readonly emailText: Locator;

    // Card information
    readonly cardNumberInput: Locator;
    readonly cardDateInput: Locator;
    readonly cardCVCInput: Locator;
    readonly nameOnCardInput: Locator;

    readonly payButton: Locator;
    readonly successButton: Locator;

    constructor(page: Page, path = "") {
        super(page, path);
        // Order details
        this.totalPrice = page.getByTestId("product-summary-total-amount");
        this.tax = page.locator("div.flex-container span.Text-color--gray400.Text--tabularNumbers");

        this.emailText = page.locator("div.ReadOnlyFormField-title");
        // Card information
        this.cardNumberInput = page.locator("#cardNumber");
        this.cardDateInput = page.locator("#cardExpiry");
        this.cardCVCInput = page.locator("#cardCvc");
        this.nameOnCardInput = page.locator("#billingName");

        this.payButton = page.getByTestId("hosted-payment-submit-button");
        this.successButton = page.getByTestId("submit-button-success");
    }

    async verifyStripeTitle(page: Page, title: string) {
        await expect(page).toHaveTitle(title, { timeout: 30000 });
    }

    async verifyTotalPrice(totalPrice: string) {
        await expect(this.totalPrice).toHaveText(totalPrice);
    }
    async verifyTax(tax: string) {
        await expect(this.tax).toHaveText(tax);
    }

    async verifyEmail(email: string) {
        await expect(this.emailText).toHaveText(email);
    }

    async fillOutRequiredCardData(cardNumber: string, cardDate: string, cardCVC: string, nameOnCard: string) {
        await this.cardNumberInput.fill(cardNumber);
        await this.cardDateInput.fill(cardDate);
        await this.cardCVCInput.fill(cardCVC);
        await this.nameOnCardInput.fill(nameOnCard);
    }

    async verifyPaymentIsSuccessful() {
        await this.payButton.click();
        await expect(this.successButton).toBeVisible({ timeout: 15000 });
    }
}
