import { test, expect, Page } from "@playwright/test";
import { ConfigurationPage } from "../pages/configuration-page";
import { RegisterOrLoginPage } from "../pages/register-or-login-page";
import { RegisterPage } from "../pages/register-page";
import { getTestEmail } from "../../test-data/emails";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { ClientConfigGMBHDefault } from "../../helper/cart-simulator";

type languageSetup = {
    userBrowserLanguage: string;
    expectedDisplayLanguage: string;
    expectedPreferredLanguage: string;
};
type testConfig = {
    description: string;
    languageSetup: languageSetup;
};

let testProduct: Product = {};
const clickCount = 1;

const testData: Array<testConfig> = [
    {
        description: "preferred+display language should be english",
        languageSetup: {
            userBrowserLanguage: "en",
            expectedDisplayLanguage: "en",
            expectedPreferredLanguage: "English",
        },
    },
    {
        description: "preferred+display language should be german",
        languageSetup: {
            userBrowserLanguage: "de",
            expectedDisplayLanguage: "de",
            expectedPreferredLanguage: "Deutsch",
        },
    },
    {
        description: "Spanish is not availabe, english should be pre-filled",
        languageSetup: {
            userBrowserLanguage: "es",
            expectedDisplayLanguage: "en",
            expectedPreferredLanguage: "English",
        },
    },
];

test.describe("Display language and preferred contact language are based on the default browser language of the user - ", () => {
    let page: Page;
    test.beforeAll(async ({ request }) => {
        const productRepository = new ProductFetcher(request, ClientConfigGMBHDefault);
        testProduct = await productRepository.getProduct();
    });

    for (const testSet of testData) {
        test(testSet.description, async ({ browser }) => {
            page = await browser.newPage({
                locale: testSet.languageSetup.userBrowserLanguage,
            });
            const configurationPage = new ConfigurationPage(page);
            const registerOrLoginPage = new RegisterOrLoginPage(page);
            const registerPage = new RegisterPage(page);

            //check display language
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.verifySelectedDisplayLanguage(
                testSet.languageSetup.expectedDisplayLanguage
            );
            await expect(page).toHaveURL(`/${testSet.languageSetup.expectedDisplayLanguage}`);

            //check preferred contact language is the same as Display language
            await configurationPage.addProductByMarketPlaceCode(page, testProduct.marketplaceCode!, clickCount);
            await configurationPage.submitButton.click();
            await registerOrLoginPage.fillEmail(getTestEmail(), page);
            await registerOrLoginPage.submitButton.click();
            await registerPage.verifySelectedCommunicationLanguage(testSet.languageSetup.expectedPreferredLanguage);
        });
    }

    test.afterEach(async () => {
        await page.close();
    });
});
