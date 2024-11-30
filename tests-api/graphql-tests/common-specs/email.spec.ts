import { test } from "@playwright/test";
import { getTestEmail } from "../../../test-data/emails";
import { MutationRequest } from "../requests/mutation-request";
import { MutationResponse } from "../requests/mutation-response";
import {
    ClientConfig,
    ClientConfigGMBHDefault,
    ClientConfigGMBHEnglish,
    ClientConfigPTEDefault,
} from "../../../helper/cart-simulator";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import * as URLS from "../../../test-data/urls.json";
import { MailosaurService } from "../../../helper/mailosaur-service";
import { AddressMaxMustermann } from "../../../test-data/address";
import { ClientTitles, ClientTitlesGMBH, ClientTitlesPTE } from "../../../test-data/client-titles";
import { DisplayLanguage, DisplayLanguageEnglish, DisplayLanguageGerman } from "../../../test-data/display-languages";
import * as bc from "../../../test-data/billing-countries";

const mutationRequest = new MutationRequest();
const mutationResponse = new MutationResponse();
const mailosaurService = new MailosaurService();

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
    const baseURL = GQLUriBuilder(testCase.clientConfig);
    const testEMail = getTestEmail();

    test(testCase.description, async ({ request }) => {
        // Set language
        let response = await request.post(baseURL, {
            data: {
                query: mutationRequest.updateAdditionalData("language", testCase.displayLanguage.code),
            },
        });
        await mutationResponse.verifyUpdateAdditionalDataResponse(response, "Commerce_Cart_DecoratedCart");

        // Start registration
        response = await request.post(baseURL, {
            data: {
                query: mutationRequest.startVerification(testEMail),
            },
        });
        await mutationResponse.verifyStartVerificationResponse(response, true);

        //Verify language, Hello - English
        await mailosaurService.verifyEmailContainsValue(testEMail, testCase.displayLanguage.keyWord);
        //Verify client footer
        await mailosaurService.verifyEmailContainsValue(testEMail, testCase.clientTitles.emailFooter);
        //Verify social links are there - facebook, linkedin, twitter, youtube
        await mailosaurService.verifyEmailContainsValue(testEMail, URLS.Facebook);
        await mailosaurService.verifyEmailContainsValue(testEMail, URLS.LinkedIn);
        await mailosaurService.verifyEmailContainsValue(testEMail, URLS.Twitter);
        await mailosaurService.verifyEmailContainsValue(testEMail, URLS.YouTube);

        if (testCase.clientTitles == ClientTitlesGMBH) {
            //Verify xing is present
            await mailosaurService.verifyEmailContainsValue(testEMail, URLS.Xing);
        } else if (testCase.clientTitles == ClientTitlesPTE) {
            //Verify 1nce site is present
            await mailosaurService.verifyEmailContainsValue(testEMail, URLS.HOMEPAGE_1NCE);
        }

        // Finish registration
        const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

        response = await request.post(baseURL, {
            data: {
                query: mutationRequest.finishVerification(
                    AddressMaxMustermann.firstName,
                    AddressMaxMustermann.lastName,
                    confirmationCode!,
                    AddressMaxMustermann.country,
                    AddressMaxMustermann.companyName
                ),
            },
        });

        await mutationResponse.verifyFinishVerificationResponse(response, true);
    });
});
