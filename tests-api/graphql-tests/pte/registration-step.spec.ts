import { test } from "@playwright/test";
import { MutationRequest } from "../requests/mutation-request";
import { MutationResponse } from "../requests/mutation-response";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import { ClientConfigPTEDefault } from "../../../helper/cart-simulator";
import { getTestEmail } from "../../../test-data/emails";
import { MailosaurService } from "../../../helper/mailosaur-service";
import { AddressIvanIvanov } from "../../../test-data/address";
import { VatInvalid, VatMaxLengthError } from "../../../test-data/tax";

const GRAPHQL_URL_BFF_PTE = GQLUriBuilder(ClientConfigPTEDefault);

test("VAT validation is disabled for PTE clients", async ({ request }) => {
    const mutationRequest = new MutationRequest();
    const mutationResponse = new MutationResponse();
    const mailosaurService = new MailosaurService();
    const testEMail = getTestEmail();

    await test.step("registration of a new customer is successful", async () => {
        await test.step("should be a new customer", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_PTE, {
                data: {
                    query: mutationRequest.startVerification(testEMail),
                },
            });

            await mutationResponse.verifyStartVerificationResponse(response, true);
        });

        const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

        const response = await request.post(GRAPHQL_URL_BFF_PTE, {
            data: {
                query: mutationRequest.finishVerification(
                    AddressIvanIvanov.firstName,
                    AddressIvanIvanov.lastName,
                    confirmationCode!,
                    AddressIvanIvanov.country,
                    AddressIvanIvanov.companyName
                ),
            },
        });

        await mutationResponse.verifyFinishVerificationResponse(response, true);
    });

    await test.step("setting a billing address is successful even when VAT is invalid", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_PTE, {
            data: {
                query: mutationRequest.setBillingAddress(
                    AddressIvanIvanov.firstName,
                    AddressIvanIvanov.lastName,
                    AddressIvanIvanov.address,
                    AddressIvanIvanov.companyName,
                    AddressIvanIvanov.city,
                    AddressIvanIvanov.postCode,
                    AddressIvanIvanov.phoneNumber,
                    AddressIvanIvanov.country,
                    testEMail,
                    VatInvalid.id
                ),
            },
        });

        await mutationResponse.verifyUpdateBillingAddressResponse(
            response,
            VatInvalid.id,
            AddressIvanIvanov.firstName,
            AddressIvanIvanov.lastName,
            AddressIvanIvanov.address,
            AddressIvanIvanov.companyName,
            AddressIvanIvanov.city,
            AddressIvanIvanov.postCode,
            AddressIvanIvanov.country,
            AddressIvanIvanov.phoneNumber,
            testEMail,
            true,
            null,
            null
        );
    });
});

test("VAT can not be longer than x chars", async ({ request }) => {
    const mutationRequest = new MutationRequest();
    const mutationResponse = new MutationResponse();
    const mailosaurService = new MailosaurService();

    const testEMail = getTestEmail();

    await test.step("registration of a new customer is successful", async () => {
        await test.step("should be a new customer", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_PTE, {
                data: {
                    query: mutationRequest.startVerification(testEMail),
                },
            });

            await mutationResponse.verifyStartVerificationResponse(response, true);
        });

        const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

        const response = await request.post(GRAPHQL_URL_BFF_PTE, {
            data: {
                query: mutationRequest.finishVerification(
                    AddressIvanIvanov.firstName,
                    AddressIvanIvanov.lastName,
                    confirmationCode!,
                    AddressIvanIvanov.country,
                    AddressIvanIvanov.companyName
                ),
            },
        });

        await mutationResponse.verifyFinishVerificationResponse(response, true);
    });

    await test.step("setting a billing address fails because VAT has too many characters", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_PTE, {
            data: {
                query: mutationRequest.setBillingAddress(
                    AddressIvanIvanov.firstName,
                    AddressIvanIvanov.lastName,
                    AddressIvanIvanov.address,
                    AddressIvanIvanov.companyName,
                    AddressIvanIvanov.city,
                    AddressIvanIvanov.postCode,
                    AddressIvanIvanov.phoneNumber,
                    AddressIvanIvanov.country,
                    testEMail,
                    VatMaxLengthError.id
                ),
            },
        });

        await mutationResponse.verifyUpdateBillingAddressResponse(
            response,
            VatMaxLengthError.id,
            AddressIvanIvanov.firstName,
            AddressIvanIvanov.lastName,
            AddressIvanIvanov.address,
            AddressIvanIvanov.companyName,
            AddressIvanIvanov.city,
            AddressIvanIvanov.postCode,
            AddressIvanIvanov.country,
            AddressIvanIvanov.phoneNumber,
            testEMail,
            false,
            [{ defaultLabel: "Vat max", fieldName: "vat", messageKey: "formError.vat.max" }],
            null
        );
    });
});
