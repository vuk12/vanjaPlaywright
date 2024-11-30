import { Locator, Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class ConfigurationPage extends BasePage {
    productCart: Locator | undefined;
    readonly decrementButton: Locator;
    readonly incrementButton: Locator;
    readonly inputField: Locator;

    readonly totalPrice: Locator;
    readonly shippingLabel: Locator;
    readonly estimatedPrice: Locator;

    readonly orderOver10kText: Locator;
    readonly orderTaxInfoText:Locator;
    readonly orderVATLabel:Locator;

    readonly submitButton: Locator;

    constructor(page: Page, path = "/") {
        if (process.env.test_env === "local") {
            // Because max mind does not work in local env we always use DE as billing country
            super(page, `${path}?billingCountry=DE`);
        } else {
            super(page, path);
        }
        this.decrementButton = page.getByTestId(/decrement/);
        this.incrementButton = page.getByTestId(/increment/);
        this.inputField = page.getByTestId(/input/);
        this.totalPrice = page.getByTestId(/totalPrice/);
        this.shippingLabel = page.getByText("Shipping Worldwide");
        this.estimatedPrice = page.getByTestId("productSummary-estimatedTotalPrice");
        this.orderOver10kText = page.getByTestId("order-over-10k-hint");
        this.orderTaxInfoText = page.locator('xpath=//label[@data-testid="taxInfo"]/span');
        this.orderVATLabel = page.locator('xpath=//span[text() = "VAT"]');

        this.submitButton = page.getByTestId("gotoRegistration");
    }

    /**
     * @param marketPlaceCode define product to add
     * @param itemCount is used to add a certain count of product by clicking on plus button
     */
    async addProductByMarketPlaceCode(page: Page, marketPlaceCode: string | RegExp, itemCount: number) {
        this.productCart = page.getByTestId(marketPlaceCode);
        await this.productCart.locator(this.incrementButton).click({ clickCount: itemCount });
    }

    /**
     * @param marketPlaceCode define product to subtract
     * @param itemCount is used to subtract a certain count of product by clicking on minus button
     */
    async subtractProductByMarketPlaceCode(page: Page, marketPlaceCode: string, itemCount: number) {
        this.productCart = page.getByTestId(marketPlaceCode);
        await this.productCart.locator(this.decrementButton).click({ clickCount: itemCount });
    }

    /**
     * @param marketPlaceCode define product to input
     * @param countOfItems is used to enter a certain count of items by filling in the input field
     */
    async inputCountOfProductByMarketPlaceCode(page: Page, marketPlaceCode: string, countOfItems: string) {
        this.productCart = page.getByTestId(marketPlaceCode);
        await this.productCart.locator(this.inputField).fill(countOfItems);
    }

    async verifyCountOfItemsByMarketPlaceCode(page: Page, marketPlaceCode: string, countOfItems: string) {
        this.productCart = page.getByTestId(marketPlaceCode);
        await expect(this.productCart.locator(this.inputField)).toHaveValue(countOfItems);
    }

    async verifyTotalPriceOfProductByMarketPlaceCode(page: Page, marketPlaceCode: string, totalPrice: string) {
        this.productCart = page.getByTestId(marketPlaceCode);
        await expect(this.productCart.locator(this.totalPrice)).toHaveText(totalPrice);
    }

    async verifyEstimatedPrice(totalPrice: string) {
        await expect(this.estimatedPrice).toHaveText(totalPrice);
    }

    async verifyOrderTaxInfoText(taxInfoText: string) {
        await expect(this.orderTaxInfoText).toHaveText(taxInfoText);
    }

    async verifyOrderVATisNotDisplayed() {
        await this.orderVATLabel.waitFor({ state: 'detached' })
    }

    async verifyShippingLabelIsNotDisplayed() {
        await this.shippingLabel.waitFor({ state: 'detached' })
    }
}
