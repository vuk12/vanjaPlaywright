import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";
import { Address } from "../../test-data/address";
import { getCountryName } from "../../helper/country-service";
import { DisplayLanguageEnglish } from "../../test-data/display-languages";

export class BillingAndDeliveryPage extends BasePage {
    // Billing and delivery
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly companyInput: Locator;
    readonly phoneNumberInput: Locator;
    readonly mainAddressInput: Locator;
    readonly additionalAddressInput: Locator;
    readonly cityInput: Locator;
    readonly billingCountryDropbox: Locator;
    readonly billingCountryNotInListButton: Locator;
    readonly postCodeInput: Locator;
    readonly vatInput: Locator;
    readonly hasNoVatCheckBox: Locator;
    readonly hasNoVatHint: Locator;
    readonly customerReferenceInput: Locator;

    readonly invalidVATIDText: Locator;

    // Shipping address
    readonly shippingIsDifferentCheckbox: Locator;
    readonly shippingFirstNameInput: Locator;
    readonly shippingLastNameInput: Locator;
    readonly shippingCompanyInput: Locator;
    readonly receiverPhoneNumberInput: Locator;
    readonly shippingMainAddressInput: Locator;
    readonly shippingCityInput: Locator;
    readonly shippingPostCodeInput: Locator;
    // Shipping country
    readonly shippingCountryDropbox: Locator;
    readonly shippingCountryPlaceholder: Locator;
    readonly listbox: Locator;
    readonly submitButton: Locator;

    constructor(page: Page, path = "/billing-and-delivery") {
        super(page, path);

        // Billing and delivery
        this.firstNameInput = page.getByTestId("firstname");
        this.lastNameInput = page.getByTestId("lastname");
        this.companyInput = page.getByTestId("company");
        this.phoneNumberInput = page.getByTestId("phoneNumber");
        this.mainAddressInput = page.getByTestId("addressLine1");
        this.additionalAddressInput = page.getByTestId("addressLine2");
        this.cityInput = page.getByTestId("city");
        this.billingCountryDropbox = page.getByTestId("selectBillingCountry");
        this.billingCountryNotInListButton = page.getByTestId("billingCountryNotInListButton");
        this.postCodeInput = page.getByTestId("postCode");
        this.vatInput = page.getByTestId("vat");
        this.hasNoVatCheckBox = page.getByTestId("hasNoVat");
        this.hasNoVatHint = page.getByTestId("hasNoVat-hint");
        this.customerReferenceInput = page.getByTestId("reference");

        this.invalidVATIDText = page.getByTestId("gotoPayment-hint");

        // Shipping address
        this.shippingIsDifferentCheckbox = page.getByTestId("shippingIsDifferent");
        this.shippingFirstNameInput = page.getByTestId("shippingFirstname");
        this.shippingLastNameInput = page.getByTestId("shippingLastname");
        this.shippingCompanyInput = page.getByTestId("shippingCompany");
        this.receiverPhoneNumberInput = page.getByTestId("receiverPhoneNumber");
        this.shippingMainAddressInput = page.getByTestId("shippingAddressLine1");
        this.shippingCityInput = page.getByTestId("shippingCity");
        this.shippingPostCodeInput = page.getByTestId("shippingPostCode");
        // Shipping country
        this.shippingCountryDropbox = page.getByTestId("selectDeliveryCountry");
        this.shippingCountryPlaceholder = page.getByTestId("selectDeliveryCountry-placeholder");
        this.listbox = page.getByRole("listbox");

        this.submitButton = page.getByTestId("gotoPayment");
    }

    // Actions
    async chooseShippingCountry(page: Page, countryCode: string) {
        await this.shippingCountryDropbox.click();
        await expect(this.listbox).toBeVisible();
        const shippingCountry = page.getByTestId(`selectDeliveryCountry-option-${countryCode}`);
        await shippingCountry.click();
        await expect(this.listbox).not.toBeVisible();
    }

    async selectHasNoVatCheckbox() {
        await expect(this.hasNoVatHint).not.toBeVisible();
        await this.hasNoVatCheckBox.click();
        await expect(this.hasNoVatHint).toBeVisible();
    }

    async clickNextButton() {
        await this.submitButton.click();
    }

    // Assertions

    async verifyPrefilledFirstNameLastNameCompany(firstname: string, lastname: string, company: string) {
        await expect(this.firstNameInput).toHaveValue(firstname);
        await expect(this.lastNameInput).toHaveValue(lastname);
        await expect(this.companyInput).toHaveValue(company);
    }

    async verifyPrefilledPhoneNumber(phoneNumber: string) {
        await expect(this.phoneNumberInput).toHaveValue(phoneNumber, { timeout: 10000 });
    }

    async verifyPrefilledVAT(vat: string) {
        await expect(this.vatInput).toHaveValue(vat, { timeout: 10000 });
    }

    async verifyInvalidVATIDTextIsVisible() {
        await expect(this.invalidVATIDText).toBeVisible({ timeout: 10000 });
    }

    async verifyShippingCountryIsEmpty() {
        await expect(this.shippingCountryPlaceholder).toBeVisible();
    }

    async fillOnlyAddress(billingInfo:Address){
        await this.verifyPrefilledFirstNameLastNameCompany(
            billingInfo.firstName,
            billingInfo.lastName,
            billingInfo.companyName
        );
        await this.phoneNumberInput.fill(billingInfo.phoneNumber);
        await this.mainAddressInput.fill(billingInfo.address);
        await this.cityInput.fill(billingInfo.city);
        await this.postCodeInput.fill(billingInfo.postCode);

        await expect(this.receiverPhoneNumberInput).not.toBeVisible(); 
    }

    async fillShippingAddress(shippingInfo:Address, page:Page, billingPhone:string){
        const shippingCountryName = getCountryName(DisplayLanguageEnglish.code, shippingInfo.country)!;

        await this.shippingIsDifferentCheckbox.click();

        await expect(this.receiverPhoneNumberInput).toHaveValue(billingPhone);

        await this.shippingFirstNameInput.fill(shippingInfo.firstName);
        await this.shippingLastNameInput.fill(shippingInfo.lastName);
        await this.shippingCompanyInput.fill(shippingInfo.companyName);
        await this.receiverPhoneNumberInput.fill(shippingInfo.phoneNumber);
        await this.shippingMainAddressInput.fill(shippingInfo.address);
        await this.shippingCityInput.fill(shippingInfo.city);
        await this.shippingPostCodeInput.fill(shippingInfo.postCode);
        await this.verifyShippingCountryIsEmpty();
        await this.chooseShippingCountry(page, shippingInfo.country);
        await expect(this.shippingCountryDropbox).toHaveText(shippingCountryName);
    }

    async completePage(billingInfo:Address, page:Page, hasShipping:boolean, shippingInfo?:Address){
        await this.fillOnlyAddress(billingInfo);
        if(hasShipping){
            await this.fillShippingAddress(shippingInfo, page, billingInfo.phoneNumber);
        }
        await this.clickNextButton();
    }
}
