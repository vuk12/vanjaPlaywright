import { test, expect } from "../pages/fixtures";
import {
    CartSimulator,
    ClientConfig,
    ClientConfigGMBHDefault,
    ClientConfigGMBHEnglish,
} from "../../helper/cart-simulator";
import { Address, AddressIvanIvanov, AddressMaxMustermann } from "../../test-data/address";
import { Tax, VatInvalid, VatValid } from "../../test-data/tax";
import * as bc from "../../test-data/billing-countries";
import { DisplayLanguage, DisplayLanguageEnglish, DisplayLanguageGerman } from "../../test-data/display-languages";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { getCountryName } from "../../helper/country-service";
import { MailosaurService } from "../../helper/mailosaur-service";
import { getTestEmail } from "../../test-data/emails";
import { ClientTitlesGMBH } from "../../test-data/client-titles";
import { CreditCardSuccess } from "../../test-data/credit-card";
import * as URLS from "../../test-data/urls.json";

type GMBHTestSet = {
    description: string;
    clientConfig: ClientConfig;
    displayLanguage: DisplayLanguage;
    billingCountry: bc.BillingCountry;
    productClickCounts: Array<number> | null;
    totalPrice: number | null;
    billingAddress: Address;
    shippingAddress: Address | null;
    paymentOption: "Stripe" | "Sepa";
    tax: Tax | null;
};

const gmbhTestCases: Array<GMBHTestSet> = [
    {
        description:
            "german, 1 product, billing and shipping address are identical, valid vat, total price > 10k, sepa",
        clientConfig: ClientConfigGMBHDefault,
        displayLanguage: DisplayLanguageGerman,
        billingCountry: bc.BillingCountryGermany,
        productClickCounts: null,
        totalPrice: 10000,
        billingAddress: AddressMaxMustermann,
        shippingAddress: AddressIvanIvanov,
        paymentOption: "Sepa",
        tax: VatValid,
    },
    {
        description:
            "german, 2 products, billing and shipping address are not identical, invalid vat, total price < 10k, sepa",
        clientConfig: ClientConfigGMBHDefault,
        displayLanguage: DisplayLanguageGerman,
        billingCountry: bc.BillingCountryGermany,
        productClickCounts: [1, 4],
        totalPrice: null,
        billingAddress: AddressMaxMustermann,
        shippingAddress: AddressIvanIvanov,
        paymentOption: "Sepa",
        tax: VatInvalid,
    },
    {
        description:
            "english, 3 products, billing and shipping address are identical, no vat, total price < 10k, stripe",
        clientConfig: ClientConfigGMBHEnglish,
        displayLanguage: DisplayLanguageEnglish,
        billingCountry: bc.BillingCountryGermany,
        productClickCounts: [1, 1, 1],
        totalPrice: null,
        billingAddress: AddressMaxMustermann,
        shippingAddress: null,
        paymentOption: "Stripe",
        tax: null,
    },
    {
        description:
            "@local english, 3 products, billing and shipping address are identical, valid vat, total price < 10k, stripe",
        clientConfig: ClientConfigGMBHEnglish,
        displayLanguage: DisplayLanguageEnglish,
        billingCountry: bc.BillingCountryGermany,
        productClickCounts: [103],
        totalPrice: null,
        billingAddress: AddressMaxMustermann,
        shippingAddress: null,
        paymentOption: "Stripe",
        tax: VatValid,
    },
];

const products: Array<Product> = [];
test.beforeAll(async ({ request }) => {
    const productRepository = new ProductFetcher(request, ClientConfigGMBHDefault);
    // Fetch products
    Promise.all([
        await productRepository.getProduct(),
        await productRepository.getProduct(),
        await productRepository.getProduct(),
    ]).then((values) => {
        products.push(...values);
    });
});

gmbhTestCases.forEach((testCase) => {
    test(testCase.description, async ({ page, configurationPage, registerOrLoginPage, registerPage, billingAndDeliveryPage, checkoutPage,stripePage, confirmationPage }) => {
        const cart = new CartSimulator(testCase.clientConfig);
        const mailosaurService = new MailosaurService();
        const billingCountryName = getCountryName(testCase.displayLanguage.code, testCase.billingCountry.code)!;
        let shippingCountryName: string;
        const testEmail = getTestEmail();

        if (testCase.totalPrice) {
            cart.add(products[0], cart.qtyForAmountBiggerThan(products[0], testCase.totalPrice));
        } else {
            for (const key in testCase.productClickCounts) {
                cart.add(products[key], testCase.productClickCounts[key] * products[key].packageSize!);
            }
        }

        const prices = {
            itemsTotal: cart.asCurrencyString(cart.totalAmountRaw()),
            shippingPrice: cart.asCurrencyString(cart.shippingCosts),
            estimatedTotal: cart.asCurrencyString(cart.totalAmountRawWithShipping()),
            VAT: cart.asCurrencyString(cart.taxes()),
            totalPrice: cart.asCurrencyString(cart.grandTotalWithTax()),
        };

        await test.step("configuration page", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                testCase.billingCountry.code
            );
            await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, testCase.displayLanguage.code);
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
            await registerPage.completeRegisterPage(confirmationCode, testCase.billingAddress)
        });
        await test.step("billing and delivery page", async () => {
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                testCase.billingAddress.firstName,
                testCase.billingAddress.lastName,
                testCase.billingAddress.companyName
            );
            await expect(billingAndDeliveryPage.billingCountryDropbox).toBeDisabled();
            await billingAndDeliveryPage.clickNextButton();
            await expect(registerPage.errorMessageText.nth(0)).toBeVisible();
            await billingAndDeliveryPage.phoneNumberInput.fill(testCase.billingAddress.phoneNumber);
            await billingAndDeliveryPage.mainAddressInput.fill(testCase.billingAddress.address);
            await billingAndDeliveryPage.cityInput.fill(testCase.billingAddress.city);
            await billingAndDeliveryPage.postCodeInput.fill(testCase.billingAddress.postCode);

            switch (testCase.tax) {
                case VatValid:
                    await billingAndDeliveryPage.vatInput.fill(testCase.tax.id);
                    break;
                case VatInvalid:
                    await billingAndDeliveryPage.vatInput.fill(testCase.tax.id);
                    await billingAndDeliveryPage.clickNextButton();
                    await expect(billingAndDeliveryPage.invalidVATIDText).toBeVisible();
                    break;
                default:
                    await billingAndDeliveryPage.selectHasNoVatCheckbox();
                    break;
            }

            await expect(registerPage.errorMessageText).not.toBeVisible();
            await expect(billingAndDeliveryPage.receiverPhoneNumberInput).not.toBeVisible();

            if (testCase.shippingAddress) {
                shippingCountryName = getCountryName(testCase.displayLanguage.code, testCase.shippingAddress.country)!;

                await billingAndDeliveryPage.shippingIsDifferentCheckbox.click();

                await expect(billingAndDeliveryPage.receiverPhoneNumberInput).toHaveValue(
                    testCase.billingAddress.phoneNumber
                );

                await billingAndDeliveryPage.clickNextButton();
                await expect(registerPage.errorMessageText.nth(0)).toBeVisible();
                await billingAndDeliveryPage.shippingFirstNameInput.fill(testCase.shippingAddress.firstName);
                await billingAndDeliveryPage.shippingLastNameInput.fill(testCase.shippingAddress.lastName);
                await billingAndDeliveryPage.shippingCompanyInput.fill(testCase.shippingAddress.companyName);
                await billingAndDeliveryPage.receiverPhoneNumberInput.fill(testCase.shippingAddress.phoneNumber);
                await billingAndDeliveryPage.shippingMainAddressInput.fill(testCase.shippingAddress.address);
                await billingAndDeliveryPage.shippingCityInput.fill(testCase.shippingAddress.city);
                await billingAndDeliveryPage.shippingPostCodeInput.fill(testCase.shippingAddress.postCode);
                await billingAndDeliveryPage.verifyShippingCountryIsEmpty();
                await billingAndDeliveryPage.chooseShippingCountry(page, testCase.shippingAddress.country);
                await expect(billingAndDeliveryPage.shippingCountryDropbox).toHaveText(shippingCountryName);
                await expect(registerPage.errorMessageText).not.toBeVisible();
            }
            await billingAndDeliveryPage.clickNextButton();
        });
        await test.step("checkout page", async () => {
            await checkoutPage.verifyBillingAddressData(
                testCase.billingAddress.firstName,
                testCase.billingAddress.lastName,
                testCase.billingAddress.companyName,
                testCase.billingAddress.address,
                testCase.billingAddress.postCode,
                testCase.billingAddress.city,
                billingCountryName
            );
            if (testCase.shippingAddress) {
                await checkoutPage.verifyShippingAddressData(
                    testCase.shippingAddress.firstName,
                    testCase.shippingAddress.lastName,
                    testCase.shippingAddress.companyName,
                    testCase.shippingAddress.address,
                    testCase.shippingAddress.postCode,
                    testCase.shippingAddress.city,
                    shippingCountryName
                );
                await checkoutPage.verifyPhoneNumber(testCase.shippingAddress.phoneNumber);
            } else {
                await checkoutPage.verifyShippingAddressData(
                    testCase.billingAddress.firstName,
                    testCase.billingAddress.lastName,
                    testCase.billingAddress.companyName,
                    testCase.billingAddress.address,
                    testCase.billingAddress.postCode,
                    testCase.billingAddress.city,
                    billingCountryName
                );
                await checkoutPage.verifyPhoneNumber(testCase.billingAddress.phoneNumber);
            }
            if (testCase.tax) {
                await checkoutPage.verifyVatId(testCase.tax.id);
            }

            for (const item of cart.getItems()) {
                await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                    page,
                    item.product.marketplaceCode!,
                    cart.asCurrencyString(cart.totalAmountByItemRaw(item.product.marketplaceCode!))
                );
            }
            await checkoutPage.verifyPrices(prices.itemsTotal, prices.shippingPrice, prices.VAT, prices.totalPrice);
            await expect(checkoutPage.bankTransferRadio).toBeVisible();

            if (testCase.totalPrice) {
                await expect(checkoutPage.creditCardRadio).not.toBeVisible();
            } else {
                await expect(checkoutPage.creditCardRadio).toBeVisible();
            }

            if (testCase.paymentOption === "Sepa") {
                await checkoutPage.bankTransferRadio.click();
            } else if (testCase.paymentOption === "Stripe") {
                await checkoutPage.creditCardRadio.click();
            }

            await checkoutPage.newsletterCheckbox.click();
            await checkoutPage.isBusinessCustomerCheckbox.click();
            await checkoutPage.agbCheckbox.click();

            await checkoutPage.submitButton.click();
        });

        if (testCase.paymentOption === "Stripe") {
            await test.step("stripe page", async () => {
                await stripePage.verifyStripeTitle(page, ClientTitlesGMBH.stripeTitle);
                await stripePage.verifyTotalPrice(prices.totalPrice);
                await stripePage.verifyTax(prices.VAT);
                await stripePage.verifyEmail(testEmail);

                await stripePage.fillOutRequiredCardData(
                    CreditCardSuccess.number,
                    CreditCardSuccess.expireDate,
                    CreditCardSuccess.cvc,
                    CreditCardSuccess.holder
                );
                await stripePage.verifyPaymentIsSuccessful();
            });
        }
        await test.step("confirmation page", async () => {
            await confirmationPage.verifyConfirmationCodeIsVisible();
            await confirmationPage.verifyEmail(testEmail);
            await confirmationPage.goToHomepageButton.click();
            await expect(page).toHaveURL(URLS.HOMEPAGE_1NCE + "/" + testCase.clientConfig.locale + "/");
        });
    });
});
