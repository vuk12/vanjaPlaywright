import { test, expect } from "../pages/fixtures";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import {
    CartSimulator,
    ClientConfigGMBHDefault,
    ClientConfigGMBHEnglish,
    ClientConfigPTEDefault,
} from "../../helper/cart-simulator";
import {
    BillingCountryGermany,
    BillingCountryMalaysia,
    BillingCountrySingapore,
} from "../../test-data/billing-countries";
import { DisplayLanguageEnglish, DisplayLanguageGerman } from "../../test-data/display-languages";
import { Utils } from "../../helper/utils";
import { MailosaurService } from "../../helper/mailosaur-service";
import { AddressMaxMustermann } from "../../test-data/address";
/**
 * Contains the first product found from the API
 */
let testProductGMBH: Product = {};
let testProductPTE: Product = {};

test.beforeAll(async ({ request }) => {
    const productRepositoryGMBH = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProductGMBH = await productRepositoryGMBH.getProduct();
    const productRepositoryPTE = new ProductFetcher(request, ClientConfigPTEDefault);
    testProductPTE = await productRepositoryPTE.getProduct();
});

test.describe("Verify cart is cleared by changing the client", () => {
    test("on configuration page", async ({ page, configurationPage }) => {
        const cartGMBH = new CartSimulator(ClientConfigGMBHDefault);
        const cartPTE = new CartSimulator(ClientConfigPTEDefault);

        const clickCountGMBH = 4;
        cartGMBH.add(testProductGMBH, clickCountGMBH * testProductGMBH.packageSize!);

        const productGMBH = {
            marketPlaceCode: testProductGMBH.marketplaceCode!,
            clickCount: clickCountGMBH,
            countOfItems: (testProductGMBH.packageSize! * clickCountGMBH).toString(),
            totalPrice: cartGMBH.asCurrencyString(cartGMBH.totalAmountByItemRaw(testProductGMBH.marketplaceCode!)),
        };

        const pricesGMBH = {
            itemsTotal: cartGMBH.asCurrencyString(cartGMBH.totalAmountRaw()),
            shippingPrice: cartGMBH.asCurrencyString(cartGMBH.shippingCosts),
            estimatedTotal: cartGMBH.asCurrencyString(cartGMBH.totalAmountRawWithShipping()),
        };

        const pricesPTE = {
            estimatedTotal: cartPTE.asCurrencyString(cartPTE.totalAmountRaw()),
        };

        await test.step("go to the next shop gmbh", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                BillingCountryGermany.code
            );
            await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);
        });

        await test.step("add product to the cart", async () => {
            await configurationPage.addProductByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.clickCount
            );
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.countOfItems
            );
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.totalPrice
            );

            await configurationPage.verifyEstimatedPrice(pricesGMBH.estimatedTotal);

            await expect(configurationPage.submitButton).not.toBeDisabled();
        });

        await test.step("choose Malaysia as a billing country, cart should be cleared", async () => {
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                BillingCountryMalaysia.code
            );
            await configurationPage.verifyEstimatedPrice(pricesPTE.estimatedTotal);
            await expect(configurationPage.submitButton).toBeDisabled();
        });
    });

    test("on billing and shipping page", async ({ page, configurationPage, registerOrLoginPage, registerPage, billingAndDeliveryPage }) => {
        const mailosaurService = new MailosaurService();
        const testEmail = Utils.generateRandomEmail();
        const cartGMBH = new CartSimulator(ClientConfigGMBHDefault);
        const cartPTE = new CartSimulator(ClientConfigPTEDefault);

        const clickCountGMBH = 4;
        cartGMBH.add(testProductGMBH, clickCountGMBH * testProductGMBH.packageSize!);

        const productGMBH = {
            marketPlaceCode: testProductGMBH.marketplaceCode!,
            clickCount: clickCountGMBH,
            countOfItems: (testProductGMBH.packageSize! * clickCountGMBH).toString(),
            totalPrice: cartGMBH.asCurrencyString(cartGMBH.totalAmountByItemRaw(testProductGMBH.marketplaceCode!)),
        };

        const pricesGMBH = {
            itemsTotal: cartGMBH.asCurrencyString(cartGMBH.totalAmountRaw()),
            shippingPrice: cartGMBH.asCurrencyString(cartGMBH.shippingCosts),
            estimatedTotal: cartGMBH.asCurrencyString(cartGMBH.totalAmountRawWithShipping()),
        };

        const pricesPTE = {
            estimatedTotal: cartPTE.asCurrencyString(cartPTE.totalAmountRaw()),
        };

        await test.step("go to the next shop gmbh", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                BillingCountryGermany.code
            );
            await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);
        });

        await test.step("add product to the cart", async () => {
            await configurationPage.addProductByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.clickCount
            );
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.countOfItems
            );
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                productGMBH.marketPlaceCode,
                productGMBH.totalPrice
            );

            await configurationPage.verifyEstimatedPrice(pricesGMBH.estimatedTotal);

            await expect(configurationPage.submitButton).not.toBeDisabled();
            await configurationPage.submitButton.click();
        });

        await test.step("register or login page -> fill out data", async () => {
            await registerOrLoginPage.fillEmail(testEmail, page);
            await registerOrLoginPage.submitButton.click();
        });

        await test.step("register page -> fill out data", async () => {
            await registerPage.verifyEmailAddress(testEmail);
            const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);

            await registerPage.fillOutRequiredData(
                confirmationCode!,
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await registerPage.submitButton.click();
        });

        await test.step("billing and shipping page -> choose Malaysia as a billing country", async () => {
            await billingAndDeliveryPage.billingCountryNotInListButton.click();
            await billingAndDeliveryPage.countryLanguageSelector.chooseBillingCountry(
                page,
                BillingCountryMalaysia.code
            );
        });
        await test.step("configuration page is open, cart should be cleared", async () => {
            await configurationPage.verifyEstimatedPrice(pricesPTE.estimatedTotal);
            await expect(configurationPage.submitButton).toBeDisabled();
        });
    });
});

test("Verify the cart wasn't cleared by changing the language", async ({ page, configurationPage }) => {
    const cartDefault = new CartSimulator(ClientConfigGMBHDefault);
    const cartEnglish = new CartSimulator(ClientConfigGMBHEnglish);
    const clickCount = 4;
    cartDefault.add(testProductGMBH, clickCount * testProductGMBH.packageSize!);
    cartEnglish.add(testProductGMBH, clickCount * testProductGMBH.packageSize!);

    const productDE = {
        marketPlaceCode: testProductGMBH.marketplaceCode!,
        clickCount: clickCount,
        countOfItems: (testProductGMBH.packageSize! * clickCount).toString(),
        totalPrice: cartDefault.asCurrencyString(cartDefault.totalAmountByItemRaw(testProductGMBH.marketplaceCode!)),
    };

    const productEN = {
        marketPlaceCode: testProductGMBH.marketplaceCode!,
        clickCount: clickCount,
        countOfItems: (testProductGMBH.packageSize! * clickCount).toString(),
        totalPrice: cartEnglish.asCurrencyString(cartEnglish.totalAmountByItemRaw(testProductGMBH.marketplaceCode!)),
    };

    await test.step("go to the next shop", async () => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            BillingCountryGermany.code
        );
        await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);
    });

    await test.step("add product to the cart", async () => {
        await configurationPage.addProductByMarketPlaceCode(page, productDE.marketPlaceCode, productDE.clickCount);
        await configurationPage.verifyCountOfItemsByMarketPlaceCode(
            page,
            productDE.marketPlaceCode,
            productDE.countOfItems
        );
        await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
            page,
            productDE.marketPlaceCode,
            productDE.totalPrice
        );
        await expect(configurationPage.submitButton).not.toBeDisabled();
    });

    await test.step("change language, verify the cart wasn't cleared", async () => {
        await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageEnglish.code);
        await configurationPage.verifyCountOfItemsByMarketPlaceCode(
            page,
            productEN.marketPlaceCode,
            productEN.countOfItems
        );
        await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
            page,
            productEN.marketPlaceCode,
            productEN.totalPrice
        );
        await expect(configurationPage.submitButton).not.toBeDisabled();
    });
});

//skip test untill FE-1539 wasn't fixed
test.skip("Verify the cart wasn't cleared by changing the pte billing country", async ({ page, configurationPage }) => {
    const cart = new CartSimulator(ClientConfigPTEDefault);

    const clickCount = 4;
    cart.add(testProductPTE, clickCount * testProductPTE.packageSize!);

    const product = {
        marketPlaceCode: testProductPTE.marketplaceCode!,
        clickCount: clickCount,
        countOfItems: (testProductPTE.packageSize! * clickCount).toString(),
        totalPrice: cart.asCurrencyString(cart.totalAmountByItemRaw(testProductPTE.marketplaceCode!)),
    };

    await test.step("go to the next shop", async () => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            BillingCountrySingapore.code
        );
    });

    await test.step("add product to the cart", async () => {
        await configurationPage.addProductByMarketPlaceCode(page, product.marketPlaceCode, product.clickCount);
        await configurationPage.verifyCountOfItemsByMarketPlaceCode(
            page,
            product.marketPlaceCode,
            product.countOfItems
        );
        await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
            page,
            product.marketPlaceCode,
            product.totalPrice
        );
        await expect(configurationPage.submitButton).not.toBeDisabled();
    });

    await test.step("change billing country, verify the cart wasn't cleared", async () => {
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            BillingCountryMalaysia.code
        );
        await configurationPage.countryLanguageSelector.verifyCountryFlag(BillingCountryMalaysia.code);

        await configurationPage.verifyCountOfItemsByMarketPlaceCode(
            page,
            product.marketPlaceCode,
            product.countOfItems
        );

        await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
            page,
            product.marketPlaceCode,
            product.totalPrice
        );
        await expect(configurationPage.submitButton).not.toBeDisabled();
    });
});
