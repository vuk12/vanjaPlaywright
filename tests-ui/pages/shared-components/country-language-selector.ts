import { Locator, Page, expect } from "@playwright/test";

export class CountryLanguageSelector {
    readonly countryLanguageSelectorButton: Locator;

    readonly countrySelectorDropdown: Locator;
    readonly languageSelectorDropdown: Locator;

    readonly listbox: Locator;
    // Languages
    readonly englishLanguage: Locator;
    readonly germanLanguage: Locator;

    readonly saveButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        this.countryLanguageSelectorButton = page.locator("header button");

        this.countrySelectorDropdown = page.getByTestId("country-select");
        this.languageSelectorDropdown = page.getByTestId("language-select");

        this.listbox = page.getByRole("listbox");
        // Languages
        this.englishLanguage = page.getByTestId("language-select-en");
        this.germanLanguage = page.getByTestId("language-select-de");

        this.saveButton = page.getByTestId("country-language-modal-confirm");
        this.cancelButton = page.getByTestId("country-language-modal-cancel");
    }

    async chooseDisplayLanguage(page: Page, languageCode: string) {
        await this.countryLanguageSelectorButton.click();
        await this.languageSelectorDropdown.click();
        await expect(this.listbox).toBeVisible();
        const language = page.getByTestId(`language-select-option-${languageCode}`);
        await language.click();
        await expect(this.listbox).not.toBeVisible();
        await this.saveButton.click();
        await this.verifySelectedDisplayLanguage(languageCode);
    }

    async verifyThereIsOnlyOneDisplayLanguage(language: string, languageCode: string) {
        await this.countryLanguageSelectorButton.click();
        await expect(this.languageSelectorDropdown).not.toBeEditable();
        await expect(this.languageSelectorDropdown).toHaveText(language);
        await this.saveButton.click();
        await this.verifySelectedDisplayLanguage(languageCode);
    }

    async verifySelectedDisplayLanguage(language: string) {
        await expect(this.countryLanguageSelectorButton).toHaveText(language.toUpperCase());
    }
    async chooseBillingCountry(page: Page, countryCode: string) {
        await this.countrySelectorDropdown.click();
        await expect(this.listbox).toBeVisible();
        const country = page.getByTestId(`country-select-option-${countryCode}`);
        await country.click();
        await expect(this.listbox).not.toBeVisible();
        await this.saveButton.click();
    }

    async chooseBillingCountryFromHeader(page: Page, countryCode: string) {
        await this.countryLanguageSelectorButton.click();
        await this.chooseBillingCountry(page, countryCode);
    }

    async verifyCountryFlag(countryCode: string) {
        await expect(this.countryLanguageSelectorButton.locator("img")).toHaveAttribute(
            "src",
            new RegExp("\\b" + countryCode + "\\b", "g")
        );
    }
}
