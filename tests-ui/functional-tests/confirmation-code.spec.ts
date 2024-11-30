import { test, expect } from "../pages/fixtures";
import { getTestEmail } from "../../test-data/emails";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { ClientConfigGMBHDefault } from "../../helper/cart-simulator";
import { AddressMaxMustermann } from "../../test-data/address";
import { MailosaurService } from "../../helper/mailosaur-service";
import { Utils } from "../../helper/utils";

let testProduct: Product = {};
let testEmail: string;

test.beforeAll(async ({ request }) => {
    const productRepositoryGMBH = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProduct = await productRepositoryGMBH.getProduct();
});

test.beforeEach(async ({ page, configurationPage, registerOrLoginPage  }) => {
    testEmail = getTestEmail();
    const product1 = { marketPlaceCode: testProduct.marketplaceCode!, clickCount: 1 };

    await test.step("configuration page", async () => {
        await configurationPage.visitAndAcceptCookies();

        await configurationPage.addProductByMarketPlaceCode(page, product1.marketPlaceCode, product1.clickCount);
        await expect(configurationPage.submitButton).not.toBeDisabled();
        await configurationPage.submitButton.click();
    });

    await test.step("register or login page", async () => {
        await registerOrLoginPage.fillEmail(testEmail, page);
        await registerOrLoginPage.submitButton.click();
    });
});

test("validation of confirmation code works properly", async ({ registerPage, billingAndDeliveryPage }) => {
    const mailosaurService = new MailosaurService();

    await test.step("register page", async () => {
        const dummyCode = Utils.generateRandomNumber().toString();

        await registerPage.fillOutRequiredData(
            dummyCode,
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );

        await registerPage.submitButton.click();
        await expect(registerPage.errorMessageText).toBeVisible();

        const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);
        await registerPage.emailConfirmationCodeInput.fill(confirmationCode!);
        await expect(registerPage.errorMessageText).not.toBeVisible();
        await registerPage.submitButton.click();
    });

    await test.step("billing and delivery page", async () => {
        await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );
    });
});

test("resend confirmation code", async ({ registerPage, billingAndDeliveryPage }) => {
    const mailosaurService = new MailosaurService();

    await test.step("register page -> resend confirmation code, check the resent email has the same code", async () => {
        const firstConfirmationCode = await mailosaurService.getConfirmationCode(testEmail);
        await mailosaurService.deleteEmail(testEmail); // Delete the first email to find the resent email

        await registerPage.resendCodeButton.click();
        await registerPage.verifyResendCodeHintIsVisible();
        await expect(registerPage.resendCodeButton).toBeDisabled();
        const secondConfirmationCode = await mailosaurService.getConfirmationCode(testEmail);
        expect(firstConfirmationCode).toEqual(secondConfirmationCode);

        await registerPage.fillOutRequiredData(
            secondConfirmationCode!,
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );
        await registerPage.submitButton.click();
    });

    await test.step("billing and delivery page", async () => {
        await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.companyName
        );
    });
});
