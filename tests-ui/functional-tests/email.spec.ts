import { test, expect } from "../pages/fixtures";
import { getTestEmail } from "../../test-data/emails";
import {
    ClientConfig,
    ClientConfigGMBHDefault,
    ClientConfigGMBHEnglish,
    ClientConfigPTEDefault,
} from "../../helper/cart-simulator";
import { ProductFetcher } from "../../helper/product-fetcher";
import { MailosaurService } from "../../helper/mailosaur-service";
import { AddressMaxMustermann } from "../../test-data/address";
import { BillingCountryGermany } from "../../test-data/billing-countries";
import { ClientTitles, ClientTitlesGMBH, ClientTitlesPTE } from "../../test-data/client-titles";
import { DisplayLanguage, DisplayLanguageEnglish, DisplayLanguageGerman } from "../../test-data/display-languages";
import { getLanguageName } from "../../helper/country-service";
import * as bc from "../../test-data/billing-countries";

type emailTest = {
    description: string;
    clientConfig: ClientConfig;
    billingCountry: bc.BillingCountry;
    displayLanguage: DisplayLanguage;
    clientTitles: ClientTitles;
};

const emailTestCase: Array<emailTest> = [
    {
        description: "gmbh, english",
        clientConfig: ClientConfigGMBHEnglish,
        billingCountry: bc.BillingCountryGermany,
        displayLanguage: DisplayLanguageEnglish,
        clientTitles: ClientTitlesGMBH,
    },
    {
        description: "gmbh, german",
        clientConfig: ClientConfigGMBHDefault,
        billingCountry: bc.BillingCountryGermany,
        displayLanguage: DisplayLanguageGerman,
        clientTitles: ClientTitlesGMBH,
    },
    {
        description: "pte, english",
        clientConfig: ClientConfigPTEDefault,
        billingCountry: bc.BillingCountrySingapore,
        displayLanguage: DisplayLanguageEnglish,
        clientTitles: ClientTitlesPTE,
    },
];

emailTestCase.forEach((testCase) => {
    test(testCase.description, async ({ request, page, configurationPage, registerOrLoginPage,registerPage,billingAndDeliveryPage }) => {
        const mailosaurService = new MailosaurService();
        const productRepository = new ProductFetcher(request, testCase.clientConfig);
        const testProduct = await productRepository.getProduct();
        const testEmail = getTestEmail();

        return test.step("add product, start verification, finish verification...", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                testCase.billingCountry.code
            );
            if (testCase.billingCountry === BillingCountryGermany) {
                await configurationPage.countryLanguageSelector.chooseDisplayLanguage(
                    page,
                    testCase.displayLanguage.code
                );
            } else {
                const displayLanguage = getLanguageName(testCase.clientConfig.locale, testCase.displayLanguage.code);
                await configurationPage.countryLanguageSelector.verifyThereIsOnlyOneDisplayLanguage(
                    displayLanguage,
                    testCase.displayLanguage.code
                );
            }

            await configurationPage.addProductByMarketPlaceCode(page, testProduct.marketplaceCode!, 1);
            await expect(configurationPage.submitButton).not.toBeDisabled();
            await configurationPage.submitButton.click();

            await registerOrLoginPage.fillEmail(testEmail, page);
            await registerOrLoginPage.submitButton.click();

            //Verify language: "Hello" - English, "Hallo" - German
            await mailosaurService.verifyEmailContainsValue(testEmail, testCase.displayLanguage.keyWord);
            //Verify client footer
            await mailosaurService.verifyEmailContainsValue(testEmail, testCase.clientTitles.emailFooter);

            const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);

            await registerPage.fillOutRequiredData(
                confirmationCode!,
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await registerPage.submitButton.click();

            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
        });
    });
});
