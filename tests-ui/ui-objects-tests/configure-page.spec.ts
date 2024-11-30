import { test } from "../pages/fixtures";
import { BillingCountryBrazil } from "../../test-data/billing-countries";
import { ClientTitlesBrazil } from "../../test-data/client-titles";

test.describe("Brazil config page", () => {

    test(`Brazil country Configuration page has all elements and links in place`, async ({ page, configurationPage, context }) => {
        await configurationPage.visitAndAcceptCookies();
        await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(page, BillingCountryBrazil.code);
        await configurationPage.footer.verifyClientName(ClientTitlesBrazil.footer);
        await configurationPage.verifyOrderTaxInfoText(`All shown prices are inclusive of tax.`);
        await configurationPage.verifyOrderVATisNotDisplayed();
        await configurationPage.verifyShippingLabelIsNotDisplayed();
        await configurationPage.footer.verifyAllLinksDisplayForBrazilShop();
        await configurationPage.footer.verifyFAQlinkAndClose(context,`shop.1nce.com/en#`);
        await configurationPage.footer.verifyImprintLinkAndClose(context,`shop.1nce.com/en#`);
        await configurationPage.footer.verifyTermsLinkAndClose(context, `1nce.com/wp-content/1nce_telecomunicacoes-business-terms-en.pdf?`);
        await configurationPage.footer.verifyPrivacyPolicyLinkAndClose(context, `1nce.com/wp-content/1nce_telecomunicacoes-data-protection-en.pdf?`);
    });

});