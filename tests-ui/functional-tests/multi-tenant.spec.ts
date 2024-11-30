import { test, expect } from "../pages/fixtures";
import { getCountryName, getLanguageName } from "../../helper/country-service";
import { ContactLanguageEnglish } from "../../test-data/contact-languages";
import { DisplayLanguageEnglish } from "../../test-data/display-languages";
import { PTECountries, GMBHCountries, BrazilCountries } from "../../test-data/billing-countries";
import { ClientTitlesBrazil, ClientTitlesGMBH, ClientTitlesPTE } from "../../test-data/client-titles";

test.describe("multi tenant switch of", () => {
    PTECountries.forEach((country) => {
        const countryName = getCountryName(DisplayLanguageEnglish.code, country.code)!;
        test(`PTE. LTD. country ${countryName} works properly`, async ({ page, configurationPage }) => {
            const contactLanguageName = getLanguageName(DisplayLanguageEnglish.code, ContactLanguageEnglish.code);
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(page, country.code);
            await configurationPage.footer.verifyClientName(ClientTitlesPTE.footer);
            await expect(configurationPage.orderOver10kText).toBeVisible();
            await configurationPage.countryLanguageSelector.verifyThereIsOnlyOneDisplayLanguage(
                contactLanguageName,
                ContactLanguageEnglish.code
            );
        });
    });

    GMBHCountries.forEach((country) => {
        const countryName = getCountryName(DisplayLanguageEnglish.code, country.code)!;
        test(`GMBH country ${countryName} works properly`, async ({ page, configurationPage }) => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(page, country.code);
            await configurationPage.footer.verifyClientName(ClientTitlesGMBH.footer);
            await expect(configurationPage.orderOver10kText).not.toBeVisible();
        });
    });

    BrazilCountries.forEach((country) => {
        const countryName = getCountryName(DisplayLanguageEnglish.code, country.code)!;
        test(`Brazil country ${countryName} works properly`, async ({ page, configurationPage }) => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(page, country.code);
            await configurationPage.footer.verifyClientName(ClientTitlesBrazil.footer);
            await configurationPage.countryLanguageSelector.verifyCountryFlag(country.code)
        });
    });
});