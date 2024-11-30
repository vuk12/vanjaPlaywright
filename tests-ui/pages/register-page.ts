import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { Address } from "../../test-data/address";

export class RegisterPage extends BasePage {
    readonly emailText: Locator;
    readonly resendCodeButton: Locator;
    readonly resendCodeHint: Locator;
    readonly emailConfirmationCodeInput: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly companyInput: Locator;

    // Preferred language for communication
    readonly communicationLanguageDropDown: Locator;
    readonly englishLanguage: Locator;
    readonly germanLanguage: Locator;

    readonly submitButton: Locator;

    constructor(page: Page, path = "/account/register") {
        super(page, path);
        this.emailText = page.locator("p.col-span-2 > span");
        this.resendCodeButton = page.getByTestId("emailConfirmationCode-link");
        this.resendCodeHint = page.getByTestId("emailConfirmationCode-hint");
        this.emailConfirmationCodeInput = page.getByTestId("emailConfirmationCode");
        this.firstNameInput = page.getByTestId("firstName");
        this.lastNameInput = page.getByTestId("lastName");
        this.companyInput = page.getByTestId("company");

        // Preferred language for communication
        this.communicationLanguageDropDown = page.getByTestId("communicationLanguage");
        this.englishLanguage = page.getByTestId("communicationLanguage-en");
        this.germanLanguage = page.getByTestId("communicationLanguage-de");

        this.submitButton = page.getByTestId("submit-registration-form");
    }

    async verifyEmailAddress(email: string) {
        await expect(this.emailText).toHaveText(email);
    }

    async verifyResendCodeHintIsVisible() {
        await expect(this.resendCodeHint).toBeVisible();
    }

    async fillOutRequiredData(confirmationCode: string, firstName: string, lastName: string, company: string) {
        await this.emailConfirmationCodeInput.fill(confirmationCode);
        await this.firstNameInput.fill(firstName);
        await this.lastNameInput.fill(lastName);
        await this.companyInput.fill(company);
    }

    async verifyThereIsOnlyOneCommunicationLanguage(language: string) {
        await expect(this.communicationLanguageDropDown).not.toBeEditable();
        await expect(this.communicationLanguageDropDown).toHaveValue(language);
    }

    async verifySelectedCommunicationLanguage(language: string) {
        await expect(this.communicationLanguageDropDown).toHaveText(language);
    }

    async chooseGermanCommunicationLanguage() {
        await this.communicationLanguageDropDown.click();
        await this.germanLanguage.click();
        await this.verifySelectedCommunicationLanguage("Deutsch");
    }

    async chooseEnglishCommunicationLanguage() {
        await this.communicationLanguageDropDown.click();
        await this.englishLanguage.click();
        await this.verifySelectedCommunicationLanguage("English");
    }

    async verifyErrorMessageIsDisplayed(testEmail:string){
        await this.verifyEmailAddress(testEmail);
        await this.submitButton.click();
        await expect(this.errorMessageText.nth(0)).toBeVisible();
    }

    async completeRegisterPage(confirmationCode:string, billingAddress:Address){
        await this.fillOutRequiredData(
            confirmationCode!,
            billingAddress.firstName,
            billingAddress.lastName,
            billingAddress.companyName
        );
        await expect(this.errorMessageText).not.toBeVisible();
        await this.submitButton.click();
    }
}
