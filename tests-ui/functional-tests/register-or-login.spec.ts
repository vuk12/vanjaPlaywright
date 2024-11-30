import { test, expect } from "../pages/fixtures";
import * as URLS from "../../test-data/urls.json";
import { CartSimulator, ClientConfigGMBHDefault } from "../../helper/cart-simulator";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { BillingCountryGermany } from "../../test-data/billing-countries";
import { existingEMail } from "../../test-data/emails";

let testProduct: Product = {};
test.beforeAll(async ({ request }) => {
    const productRepositoryGMBH = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProduct = await productRepositoryGMBH.getProduct();
});

test("@local the existing customer is redirected to the old 1nce shop", async ({ page, configurationPage, registerOrLoginPage }) => {
    const cart = new CartSimulator(ClientConfigGMBHDefault);
    cart.add(testProduct, testProduct.packageSize!);

    const product1 = {
        marketPlaceCode: testProduct.marketplaceCode!,
        clickCount: 1,
        countOfItems: cart.getItem(testProduct.marketplaceCode!).qty.toString(),
        totalPrice: cart.asCurrencyString(cart.totalAmountByItemRaw(testProduct.marketplaceCode!)),
    };

    await test.step("configuration page", async () => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            BillingCountryGermany.code
        );

        await configurationPage.addProductByMarketPlaceCode(page, product1.marketPlaceCode, product1.clickCount);
        await expect(configurationPage.submitButton).not.toBeDisabled();
        await configurationPage.submitButton.click();
    });

    await test.step("register or login page", async () => {
        await registerOrLoginPage.fillEmail(existingEMail.email, page);
        await registerOrLoginPage.submitButton.click();
        await expect(page).toHaveURL(URLS.LOGIN_1NCE);
    });
});
