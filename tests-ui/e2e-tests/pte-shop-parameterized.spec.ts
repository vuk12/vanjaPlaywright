import { test, expect } from "../pages/fixtures";
import * as URLS from "../../test-data/urls.json";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import {
    CartSimulator,
    ClientConfig,
    ClientConfigPTEDefault,
    ClientConfigPTESingapore,
} from "../../helper/cart-simulator";
import * as bc from "../../test-data/billing-countries";
import { Address, AddressErikaMusterfrau, AddressIvanIvanov, AddressMaxMustermann } from "../../test-data/address";
import { ClientTitlesPTE } from "../../test-data/client-titles";
import { getCountryName } from "../../helper/country-service";
import { DisplayLanguageEnglish } from "../../test-data/display-languages";
import { CreditCardSuccess } from "../../test-data/credit-card";
import { Tax, VatValid } from "../../test-data/tax";
import { MailosaurService } from "../../helper/mailosaur-service";
import { getTestEmail } from "../../test-data/emails";

/**
 * Known limitations
 * - Have to use strange workaround for Hong Kong and Macao in countryService. Have to figure out
 */

type PTETestSet = {
    description: string;
    clientConfig: ClientConfig;
    billingCountry: bc.BillingCountry;
    productClickCounts: Array<number> | null;
    cartLimitSum: number | null;
    billingAddress: Address;
    shippingAddress: Address | null;
    tax: Tax | null;
};

const pteTestData: Array<PTETestSet> = [
    {
        description: "Singapore, 3 products, billing and shipping address are not identical, 9%TAX, total price < 10k",
        clientConfig: ClientConfigPTESingapore,
        billingCountry: bc.BillingCountrySingapore,
        productClickCounts: [1, 2, 1],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: AddressMaxMustermann,
        tax: null,
    },
    {
        description: "Australia, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryAustralia,
        productClickCounts: [2],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "China, 2 products, with TAXID, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryChina,
        productClickCounts: [1, 2],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: VatValid,
    },
    {
        description: "Hong Kong, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryHongKong,
        productClickCounts: [2],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Indonesia, 1 product, billing and shipping address are not identical, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryIndonesia,
        productClickCounts: [2],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: AddressErikaMusterfrau,
        tax: null,
    },
    {
        description:
            "South Korea, 2 products, billing and shipping address are not identical, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountrySouthKorea,
        productClickCounts: [3, 4],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: AddressErikaMusterfrau,
        tax: null,
    },
    {
        description: "Macao, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryMacao,
        productClickCounts: [4],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Malaysia, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryMalaysia,
        productClickCounts: [5],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "New Zealand, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryNewZealand,
        productClickCounts: [5],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Thailand, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryThailand,
        productClickCounts: [4],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Taiwan, 1 product, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryTaiwan,
        productClickCounts: [7],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Vietnam, 3 products, 0%TAX, total price < 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryVietnam,
        productClickCounts: [1, 1, 1],
        cartLimitSum: null,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Singapore, 9%TAX, total price > 10k",
        clientConfig: ClientConfigPTESingapore,
        billingCountry: bc.BillingCountrySingapore,
        productClickCounts: null,
        cartLimitSum: 10000,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
    {
        description: "Vietnam, 0%TAX, total price > 10k",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountryVietnam,
        productClickCounts: null,
        cartLimitSum: 10000,
        billingAddress: AddressIvanIvanov,
        shippingAddress: null,
        tax: null,
    },
];

const products: Array<Product> = [];
test.beforeAll(async ({ request }) => {
    const productRepository = new ProductFetcher(request, ClientConfigPTEDefault);

    // Fetch products
    Promise.all([
        await productRepository.getProduct(),
        await productRepository.getProduct(),
        await productRepository.getProduct(),
    ]).then((values) => {
        products.push(...values);
    });
});

test.describe("all pte countries with product and address variation", () => {
    for (const t of pteTestData) {
        test(t.description, async ({ page, configurationPage, registerOrLoginPage, registerPage, billingAndDeliveryPage, checkoutPage,stripePage, confirmationPage }) => {
            const cart = new CartSimulator(t.clientConfig);
            const mailosaurService = new MailosaurService();
            const billingCountryName = getCountryName(DisplayLanguageEnglish.code, t.billingCountry.code)!;
            let shippingCountryName: string;
            const testEmail = getTestEmail();

            if (t.cartLimitSum) {
                cart.add(products[0], cart.qtyForAmountBiggerThan(products[0], t.cartLimitSum));
            } else {
                for (const key in t.productClickCounts) {
                    cart.add(products[key], t.productClickCounts[key] * products[key].packageSize!);
                }
            }

            const prices = {
                itemsTotal: cart.asCurrencyString(cart.totalAmountRaw()),
                shippingPrice: cart.asCurrencyString(cart.shippingCosts),
                estimatedTotal: cart.asCurrencyString(cart.totalAmountRawWithShipping()),
                VAT: cart.asCurrencyString(cart.taxes()),
                totalPrice: cart.asCurrencyString(cart.grandTotalWithTax()),
            };

            const pricesStripe = {
                VAT: cart
                    .taxes()
                    .toLocaleString("en-EN", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" }),
                totalPrice: cart
                    .grandTotalWithTax()
                    .toLocaleString("en-EN", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" }),
            };

            await test.step("configuration page", async () => {
                await configurationPage.visitAndAcceptCookies();
                await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                    page,
                    t.billingCountry.code
                );
                await expect(configurationPage.submitButton).toBeDisabled();

                for (const item of cart.getItems()) {
                    const itemClickCount = item.qty / item.product.packageSize!;
                    await configurationPage.addProductByMarketPlaceCode(
                        page,
                        item.product.marketplaceCode!,
                        itemClickCount
                    );
                    await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                        page,
                        item.product.marketplaceCode!,
                        item.qty.toString()
                    );
                    await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                        page,
                        item.product.marketplaceCode!,
                        cart.asCurrencyString(cart.totalAmountByItemRaw(item.product.marketplaceCode!))
                    );
                }

                await configurationPage.verifyEstimatedPrice(prices.estimatedTotal);
                await expect(configurationPage.submitButton).not.toBeDisabled();

                await configurationPage.submitButton.click();
            });

            await test.step("register or login page", async () => {
                await registerOrLoginPage.checkErrorMessageDisplayed();
                await registerOrLoginPage.completeRegisterOrLoginPage(testEmail,page);
            });

            await test.step("register page", async () => {
                await registerPage.verifyErrorMessageIsDisplayed(testEmail);
                const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);
                await registerPage.completeRegisterPage(confirmationCode, t.billingAddress)
            });

            await test.step("billing and delivery page", async () => {
                await billingAndDeliveryPage.fillOnlyAddress(t.billingAddress);

                if (t.tax) {
                    await billingAndDeliveryPage.vatInput.fill(t.tax.id);
                }

                if (t.shippingAddress) {
                    shippingCountryName = getCountryName(DisplayLanguageEnglish.code, t.shippingAddress.country)!;
                    await billingAndDeliveryPage.fillShippingAddress(t.shippingAddress,page,t.billingAddress.phoneNumber);
                }

                await billingAndDeliveryPage.clickNextButton();
            });

            await test.step("checkout page", async () => {
                await checkoutPage.verifyBillingInfoData(t.billingAddress,billingCountryName);

                if (t.shippingAddress) {
                    await checkoutPage.verifyShippingInfoData(t.shippingAddress, shippingCountryName);
                } else {
                    await checkoutPage.verifyShippingInfoData(t.billingAddress, billingCountryName);
                }

                if (t.tax) {
                    await checkoutPage.verifyVatId(t.tax.id);
                }

                for (const item of cart.getItems()) {
                    await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                        page,
                        item.product.marketplaceCode!,
                        cart.asCurrencyString(cart.totalAmountByItemRaw(item.product.marketplaceCode!))
                    );
                }

                await expect(checkoutPage.bankTransferRadio).not.toBeVisible();
                await checkoutPage.verifyPrices(prices.itemsTotal, prices.shippingPrice, prices.VAT, prices.totalPrice);

                if (t.cartLimitSum) {
                    await expect(checkoutPage.creditCardRadio).not.toBeVisible();
                    await expect(checkoutPage.errorOrderOver10kText).toBeVisible();
                    await expect(checkoutPage.submitButton).toBeDisabled();
                } else {
                    await expect(checkoutPage.creditCardRadio).toBeVisible();
                    await checkoutPage.creditCardRadio.click();

                    await checkoutPage.newsletterCheckbox.click();
                    await checkoutPage.isBusinessCustomerCheckbox.click();
                    await checkoutPage.agbCheckbox.click();

                    // Submit the order
                    await checkoutPage.submitButton.click();
                }
            });

            if (t.cartLimitSum) {
                // Cancel here if test has cartLimitSum
                return;
            }

            await test.step("stripe page", async () => {
                await stripePage.verifyStripeTitle(page, ClientTitlesPTE.stripeTitle);
                await stripePage.verifyTotalPrice(pricesStripe.totalPrice);
                await stripePage.verifyTax(pricesStripe.VAT);
                await stripePage.verifyEmail(testEmail);

                await stripePage.fillOutRequiredCardData(
                    CreditCardSuccess.number,
                    CreditCardSuccess.expireDate,
                    CreditCardSuccess.cvc,
                    CreditCardSuccess.holder
                );
                await stripePage.verifyPaymentIsSuccessful();
            });

            await test.step("confirmation page", async () => {
                await confirmationPage.verifyConfirmationCodeIsVisible();
                await confirmationPage.verifyEmail(testEmail);
                await confirmationPage.goToHomepageButton.click();
                await expect(page).toHaveURL(URLS.HOMEPAGE_1NCE + "/" + t.clientConfig.locale + "/");
            });
        });
    }
});
