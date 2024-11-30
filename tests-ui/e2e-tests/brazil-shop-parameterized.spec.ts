import { test, expect } from "../pages/fixtures";
import { getTestEmail } from "../../test-data/emails";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import {
    CartSimulator,
    ClientConfigBrazilDefault,
} from "../../helper/cart-simulator";
import {
    BrazilAddressMiguelBrazilanos,
    BrazilAddress, BrazilAddressManuelPortuguesos
} from "../../test-data/address";
import { getCountryName } from "../../helper/country-service";
import { DisplayLanguageEnglish } from "../../test-data/display-languages";
import { MailosaurService } from "../../helper/mailosaur-service";
import { EnvHelper } from "../../helper/env-helper";

type BrazilTestSet = {
    description: string;
    productClickCounts: Array<number> | null;
    cartLimitSum: number | null;
    billingAddress: BrazilAddress;
    shippingAddress: BrazilAddress | null;
};

const pteTestData: Array<BrazilTestSet> = [
    {
        description: "2 products, billing and shipping address identical",
        productClickCounts: [1, 2],
        cartLimitSum: null,
        billingAddress: BrazilAddressMiguelBrazilanos,
        shippingAddress: null
    },
    {
        description: "1 product, billing and shipping address different",
        productClickCounts: [10],
        cartLimitSum: null,
        billingAddress: BrazilAddressMiguelBrazilanos,
        shippingAddress: BrazilAddressManuelPortuguesos
    },
];

const products: Array<Product> = [];
test.beforeAll(async ({ request }) => {
    const productRepository = new ProductFetcher(request, ClientConfigBrazilDefault);

    // Fetch products
    Promise.all([
        await productRepository.getProduct(),
        await productRepository.getProduct(),
    ]).then((values) => {
        products.push(...values);
    });
});

test.describe("brazil with product and address variation", () => {
    test.skip(EnvHelper.isStaging(), "Skip for staging, works only against mocks");

    for (const t of pteTestData) {
        test(t.description, async ({ page, configurationPage,registerOrLoginPage, registerPage, billingAndDeliveryPage, checkoutPage}) => {
            const cart = new CartSimulator(ClientConfigBrazilDefault);
            //const stripePage = new StripePage(page);
            //const confirmationPage = new ConfirmationPage(page);
            const mailosaurService = new MailosaurService();
            const billingCountryName = getCountryName(DisplayLanguageEnglish.code, "BR")!;
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
                totalPrice: cart.asCurrencyString(cart.grandTotalWithTax()),
            };

            //const price = cart.grandTotalWithTax()
            //        .toLocaleString(ClientConfigBrazilDefault.locale, { style: "currency", currency: ClientConfigBrazilDefault.currency, currencyDisplay: "narrowSymbol" });

            await test.step("configuration page", async () => {
                await configurationPage.visitAndAcceptCookies();
                await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                    page,
                    "BR"
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
                await registerPage.completeRegisterPage(confirmationCode, t.billingAddress.baseAddress)
            });

            await test.step("billing and delivery page", async () => {
                if (t.shippingAddress) {
                   shippingCountryName = getCountryName(DisplayLanguageEnglish.code, t.shippingAddress.baseAddress.country)!;
                   await billingAndDeliveryPage.completePage(t.billingAddress.baseAddress,page,true, t.shippingAddress.baseAddress);
                }
                else{
                    await billingAndDeliveryPage.completePage(t.billingAddress.baseAddress,page,false);
                }  
            });

            await test.step("checkout page", async () => {
                await checkoutPage.verifyBillingInfoData(t.billingAddress.baseAddress,billingCountryName);

                if (t.shippingAddress) {
                    await checkoutPage.verifyShippingInfoData(t.shippingAddress.baseAddress, shippingCountryName);
                } else {
                    await checkoutPage.verifyShippingInfoData(t.billingAddress.baseAddress, billingCountryName);
                }

                for (const item of cart.getItems()) {
                    await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                        page,
                        item.product.marketplaceCode!,
                        cart.asCurrencyString(cart.totalAmountByItemRaw(item.product.marketplaceCode!))
                    );
                }

                await checkoutPage.verifyPricesBrazil(
                    prices.itemsTotal,
                    "BRL 197.03", // prices.itemsTotal
                    "BRL 1,234.02" // prices.totalPrice
                );

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
                    //await checkoutPage.submitButton.click();
                }
            });

            if (t.cartLimitSum) {
                // Cancel here if test has cartLimitSum
                return;
            }

            /*await test.step("stripe page", async () => {
                await stripePage.verifyStripeTitle(page, ClientTitlesPTE.stripeTitle);
                await stripePage.verifyTotalPrice(price);
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
            });*/
        });
    }
});
