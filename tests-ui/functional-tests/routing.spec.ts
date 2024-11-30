import { test, expect } from "../pages/fixtures";
import * as URLS from "../../test-data/urls.json";
import { AddressErikaMusterfrau } from "../../test-data/address";
import { DisplayLanguageEnglish, DisplayLanguageGerman } from "../../test-data/display-languages";

test.describe("routing to old shop", async () => {
    test("manually change of billing country, german language", async ({ page, configurationPage }) => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            AddressErikaMusterfrau.country
        );
        await page.waitForLoadState();
        await expect(page).toHaveURL(URLS.REDIRECTED_SHOP);
    });

    test("manually change of billing country, english language", async ({ page, configurationPage }) => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageEnglish.code);
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
            page,
            AddressErikaMusterfrau.country
        );
        await page.waitForLoadState();
        await expect(page).toHaveURL(URLS.REDIRECTED_SHOP);
    });
});
