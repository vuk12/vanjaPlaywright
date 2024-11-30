import { test, expect } from "../pages/fixtures";
import { getTestEmail } from "../../test-data/emails";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { CartSimulator, ClientConfigGMBHDefault } from "../../helper/cart-simulator";
import { AddressMaxMustermann } from "../../test-data/address";
import { VatValid } from "../../test-data/tax";
import { DisplayLanguageGerman } from "../../test-data/display-languages";
import { BillingCountryGermany } from "../../test-data/billing-countries";
import { getCountryName } from "../../helper/country-service";
import { MailosaurService } from "../../helper/mailosaur-service";

let testProduct: Product = {};
test.beforeAll(async ({ request }) => {
    const productRepositoryGMBH = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProduct = await productRepositoryGMBH.getProduct();
});
test("@local progress indicator steps work correctly", async ({ page, configurationPage, registerOrLoginPage, registerPage, billingAndDeliveryPage, checkoutPage  }) => {
    const cart = new CartSimulator(ClientConfigGMBHDefault);
    const TEST_EMAIL = getTestEmail();
    const mailosaurService = new MailosaurService();
    cart.add(testProduct, testProduct.packageSize!);

    const product1 = {
        marketPlaceCode: testProduct.marketplaceCode!,
        clickCount: 1,
        countOfItems: cart.getItem(testProduct.marketplaceCode!).qty.toString(),
        totalPrice: cart.asCurrencyString(cart.totalAmountByItemRaw(testProduct.marketplaceCode!)),
    };

    const Germany = getCountryName(DisplayLanguageGerman.code, BillingCountryGermany.code)!;

    await test.step("configuration page -> add product", async () => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            BillingCountryGermany.code
        );

        await expect(configurationPage.progressIndicator.registrationStep).toBeDisabled();
        await expect(configurationPage.progressIndicator.addAddressStep).toBeDisabled();
        await expect(configurationPage.progressIndicator.finalizeStep).toBeDisabled();

        await configurationPage.addProductByMarketPlaceCode(page, product1.marketPlaceCode, product1.clickCount);
        await configurationPage.submitButton.click();
    });

    await test.step("register or login page -> fill out data", async () => {
        await expect(page).toHaveURL(/register-or-login/);
        await expect(registerOrLoginPage.progressIndicator.configurationStep).not.toBeDisabled();
        await expect(registerOrLoginPage.progressIndicator.addAddressStep).toBeDisabled();
        await expect(registerOrLoginPage.progressIndicator.finalizeStep).toBeDisabled();

        await registerOrLoginPage.fillEmail(TEST_EMAIL, page);
        await registerOrLoginPage.submitButton.click();
    });

    await test.step("register page -> fill out data", async () => {
        await expect(page).toHaveURL(/register/);
        await expect(registerPage.progressIndicator.configurationStep).not.toBeDisabled();
        await expect(registerPage.progressIndicator.addAddressStep).toBeDisabled();
        await expect(registerPage.progressIndicator.finalizeStep).toBeDisabled();
        await registerPage.verifyEmailAddress(TEST_EMAIL);
        const confirmationCode = await mailosaurService.getConfirmationCode(TEST_EMAIL);

        await registerPage.fillOutRequiredData(
            confirmationCode!,
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );
        await registerPage.submitButton.click();
    });

    await test.step("billing and delivery page -> fill out data", async () => {
        await expect(page).toHaveURL(/billing-and-delivery/);
        await expect(billingAndDeliveryPage.progressIndicator.configurationStep).not.toBeDisabled();
        await expect(billingAndDeliveryPage.progressIndicator.registrationStep).toBeDisabled();
        await expect(billingAndDeliveryPage.progressIndicator.finalizeStep).toBeDisabled();
        await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );

        await billingAndDeliveryPage.phoneNumberInput.fill(AddressMaxMustermann.phoneNumber);
        await billingAndDeliveryPage.mainAddressInput.fill(AddressMaxMustermann.address);
        await billingAndDeliveryPage.cityInput.fill(AddressMaxMustermann.city);
        await billingAndDeliveryPage.postCodeInput.fill(AddressMaxMustermann.postCode);
        await billingAndDeliveryPage.vatInput.fill(VatValid.id);

        await billingAndDeliveryPage.clickNextButton();
    });

    await test.step("checkout page, go to billing and delivery page using progress indicator", async () => {
        await expect(page).toHaveURL(/checkout/);
        await expect(checkoutPage.progressIndicator.configurationStep).not.toBeDisabled();
        await expect(checkoutPage.progressIndicator.registrationStep).toBeDisabled();
        await expect(checkoutPage.progressIndicator.addAddressStep).not.toBeDisabled();

        // go back to billing and shipping page using progress indicator
        await checkoutPage.progressIndicator.addAddressStep.click();
    });
    await test.step("billing and delivery page is open, the entered data is remembered, go to configuration page using progress indicator", async () => {
        await expect(page).toHaveURL(/billing-and-delivery/);

        await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );

        await expect(billingAndDeliveryPage.phoneNumberInput).toHaveValue(AddressMaxMustermann.phoneNumber);
        await expect(billingAndDeliveryPage.mainAddressInput).toHaveValue(AddressMaxMustermann.address);
        await expect(billingAndDeliveryPage.cityInput).toHaveValue(AddressMaxMustermann.city);
        await expect(billingAndDeliveryPage.postCodeInput).toHaveValue(AddressMaxMustermann.postCode);
        await expect(billingAndDeliveryPage.vatInput).toHaveValue(VatValid.id);

        // go back to configuration page using progress indicator
        await billingAndDeliveryPage.progressIndicator.configurationStep.click();
    });

    await test.step("configuration page is open, the selected product is remembered, go to billing and delivery page", async () => {
        await configurationPage.verifyCountOfItemsByMarketPlaceCode(
            page,
            product1.marketPlaceCode,
            product1.countOfItems
        );
        await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
            page,
            product1.marketPlaceCode,
            product1.totalPrice
        );

        await configurationPage.submitButton.click();
    });

    await test.step("billing and delivery page is open, go to checkout page", async () => {
        await expect(page).toHaveURL(/billing-and-delivery/);

        await billingAndDeliveryPage.clickNextButton();
    });

    await test.step("checkout page page is open", async () => {
        await expect(page).toHaveURL(/checkout/);

        // Verify billing address data
        await checkoutPage.verifyBillingAddressData(
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName,
            AddressMaxMustermann.address,
            AddressMaxMustermann.postCode,
            AddressMaxMustermann.city,
            Germany
        );
    });
});
