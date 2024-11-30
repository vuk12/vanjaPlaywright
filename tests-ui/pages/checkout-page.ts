import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { Address } from "../../test-data/address";

export class CheckoutPage extends BasePage {
    // Your overview
    readonly billingAddressContainer: Locator;
    readonly shippingAddressContainer: Locator;
    readonly vatIdContainer: Locator;
    readonly phoneNumberContainer: Locator;
    readonly customerReferenceContainer: Locator;

    readonly editButton: Locator;

    // Payment options
    readonly bankTransferRadio: Locator;
    readonly creditCardRadio: Locator;
    readonly errorOrderOver10kText: Locator;

    // Order summary
    readonly productContainer: Locator;

    readonly itemsTotal: Locator;
    readonly totalPrice: Locator;
    readonly cartPrice: Locator;
    readonly shippingPrice: Locator;
    readonly vatTaxes: Locator;

    readonly newsletterCheckbox: Locator;
    readonly isBusinessCustomerCheckbox: Locator;
    readonly agbCheckbox: Locator;

    readonly submitButton: Locator;

    constructor(page: Page, path = "/order/checkout") {
        super(page, path);
        // Your overview
        this.billingAddressContainer = page.getByTestId("billingAddress-edit-field");
        this.shippingAddressContainer = page.getByTestId("shippingAddress-edit-field");
        this.vatIdContainer = page.getByTestId("vat-edit-field");
        this.phoneNumberContainer = page.getByTestId("phoneNumber-edit-field");
        this.customerReferenceContainer = page.getByTestId("reference-edit-field");

        this.editButton = page.locator("a.pl-5");

        // Payment options
        this.bankTransferRadio = page.getByTestId("sepa-payment-radio-btn");
        this.creditCardRadio = page.getByTestId("stripe-payment-radio-btn");
        this.errorOrderOver10kText = page.getByTestId("error-order-over-10k-hint");

        // Order summary
        this.productContainer = page.locator("div.flex-col > label.block");

        this.totalPrice = page.locator("span.font-semibold:nth-child(2)");
        this.itemsTotal = page.getByTestId("itemsTotal");
        this.shippingPrice = page.getByTestId("shippingCost");
        this.vatTaxes = page.getByTestId("taxAmount");
        this.cartPrice = page.getByTestId("total");

        this.newsletterCheckbox = page.locator("#newsletter~span.rounded");
        this.isBusinessCustomerCheckbox = page.locator("#isBusinessCustomer~span.rounded");
        this.agbCheckbox = page.locator("#agb~span.rounded");

        this.submitButton = page.getByTestId("submitButton");
    }

    async verifyBillingAddressData(
        firstName: string,
        lastName: string,
        companyName: string,
        address: string,
        postcode: string,
        city: string,
        billingCountry: string
    ) {
        await expect(this.billingAddressContainer).toContainText(firstName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(lastName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(companyName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(address, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(postcode, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(city, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingCountry, { ignoreCase: true });
    }

    async verifyBillingInfoData(billingInfo:Address, billingCountry: string) {
        await expect(this.billingAddressContainer).toContainText(billingInfo.firstName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingInfo.lastName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingInfo.companyName, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingInfo.address, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingInfo.postCode, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingInfo.city, { ignoreCase: true });
        await expect(this.billingAddressContainer).toContainText(billingCountry, { ignoreCase: true });
    }

    async verifyShippingAddressData(
        firstName: string,
        lastName: string,
        companyName: string,
        address: string,
        postcode: string,
        city: string,
        shippingCountry: string
    ) {
        await expect(this.shippingAddressContainer).toContainText(firstName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(lastName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(companyName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(address, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(postcode, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(city, { ignoreCase: true });
        await expect(this.shippingAddressContainer).toContainText(shippingCountry, {
            ignoreCase: true,
        });
    }

    async verifyShippingInfoData( shippingInfo:Address,shippingCountry: string
    ) {
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.firstName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.lastName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.companyName, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.address, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.postCode, {
            ignoreCase: true,
        });
        await expect(this.shippingAddressContainer).toContainText(shippingInfo.city, { ignoreCase: true });
        await expect(this.shippingAddressContainer).toContainText(shippingCountry, {
            ignoreCase: true,
        });
        await this.verifyPhoneNumber(shippingInfo.phoneNumber);
    }

    async verifyVatId(vatId: string) {
        await expect(this.vatIdContainer).toContainText(vatId);
    }

    async verifyPhoneNumber(phoneNumber: string) {
        await expect(this.phoneNumberContainer).toContainText(phoneNumber);
    }

    async editProductByMarketPlaceCode(page: Page, marketPlaceCode: string) {
        const productCart = page.getByTestId("product-" + marketPlaceCode + "-edit-field");
        await productCart.locator(this.editButton).click();
    }

    async verifyTotalPriceOfProductByMarketPlaceCode(page: Page, marketPlaceCode: string, totalPrice: string) {
        const productCart = page.getByTestId("product-" + marketPlaceCode + "-edit-field");
        await expect(productCart.locator(this.totalPrice)).toHaveText(totalPrice);
    }

    async verifyPrices(itemsTotal: string, shippingPrice: string, vatTaxes: string, cardPrice: string) {
        await expect(this.itemsTotal).toHaveText(itemsTotal);
        await expect(this.shippingPrice).toHaveText(shippingPrice);
        await expect(this.vatTaxes).toHaveText(vatTaxes);
        await expect(this.cartPrice).toHaveText(cardPrice);
    }

    async verifyPricesBrazil(itemsTotal: string, vatTaxes: string, cardPrice: string) {
        await expect(this.itemsTotal).toHaveText(itemsTotal);
        await expect(this.vatTaxes).toHaveText(vatTaxes);
        await expect(this.cartPrice).toHaveText(cardPrice);
    }
}
