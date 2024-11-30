import { test } from "@playwright/test";
import { MutationRequest } from "../requests/mutation-request";
import { MutationResponse } from "../requests/mutation-response";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import { ClientConfigGMBHDefault } from "../../../helper/cart-simulator";
import { getTestEmail } from "../../../test-data/emails";
import { MailosaurService } from "../../../helper/mailosaur-service";
import { AddressMaxMustermann } from "../../../test-data/address";
import { VatInvalid, VatValid } from "../../../test-data/tax";
import { EnvHelper } from "../../../helper/env-helper";

const GRAPHQL_URL_BFF_GMBH = GQLUriBuilder(ClientConfigGMBHDefault);

test("registration is successful", async ({ request }) => {
    const mutationRequest = new MutationRequest();
    const mutationResponse = new MutationResponse();
    const mailosaurService = new MailosaurService();
    const testEMail = getTestEmail();

    await test.step("registration of a new customer is successful", async () => {
        await test.step("should be a new customer", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.startVerification(testEMail),
                },
            });

            await mutationResponse.verifyStartVerificationResponse(response, true);
        });

        const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
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

    await test.step("setting a billing address is successful", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.setBillingAddress(
                    AddressMaxMustermann.firstName,
                    AddressMaxMustermann.lastName,
                    AddressMaxMustermann.address,
                    AddressMaxMustermann.companyName,
                    AddressMaxMustermann.city,
                    AddressMaxMustermann.postCode,
                    AddressMaxMustermann.phoneNumber,
                    AddressMaxMustermann.country,
                    testEMail,
                    VatValid.id
                ),
            },
        });

        await mutationResponse.verifyUpdateBillingAddressResponse(
            response,
            VatValid.id,
            AddressMaxMustermann.firstName,
            AddressMaxMustermann.lastName,
            AddressMaxMustermann.address,
            AddressMaxMustermann.companyName,
            AddressMaxMustermann.city,
            AddressMaxMustermann.postCode,
            AddressMaxMustermann.country,
            AddressMaxMustermann.phoneNumber,
            testEMail,
            true,
            null,
            null
        );
    });
});

test.describe("registration is successful with technical errors", () => {
    test.skip(EnvHelper.isStaging(), "Skip for staging, works only against mocks");
    const testEMail = getTestEmail();

    test("registration is successful with technical errors", async ({ request }) => {
        const mutationRequest = new MutationRequest();
        const mutationResponse = new MutationResponse();
        const mailosaurService = new MailosaurService();

        await test.step("registration is successful", async () => {
            await test.step("should be a new customer", async () => {
                const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                    data: {
                        query: mutationRequest.startVerification(testEMail),
                    },
                });

                await mutationResponse.verifyStartVerificationResponse(response, true);
            });

            const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

            const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
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

        await test.step("setting a billing address with technical VAT error is NOT successful", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.setBillingAddress(
                        AddressMaxMustermann.firstName,
                        AddressMaxMustermann.lastName,
                        AddressMaxMustermann.address,
                        AddressMaxMustermann.companyName,
                        AddressMaxMustermann.city,
                        AddressMaxMustermann.postCode,
                        AddressMaxMustermann.phoneNumber,
                        AddressMaxMustermann.country,
                        testEMail,
                        VatInvalid.id
                    ),
                },
            });

            await mutationResponse.verifyUpdateBillingAddressResponse(
                response,
                VatInvalid.id,
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.address,
                AddressMaxMustermann.companyName,
                AddressMaxMustermann.city,
                AddressMaxMustermann.postCode,
                AddressMaxMustermann.country,
                AddressMaxMustermann.phoneNumber,
                testEMail,
                false,
                [{ defaultLabel: "vat_optional", fieldName: "vat", messageKey: "optional VAT validation failed" }],
                null
            );
        });

        await test.step("on second try we expect registration to be successful because VAT should have a freePass now", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.setBillingAddress(
                        AddressMaxMustermann.firstName,
                        AddressMaxMustermann.lastName,
                        AddressMaxMustermann.address,
                        AddressMaxMustermann.companyName,
                        AddressMaxMustermann.city,
                        AddressMaxMustermann.postCode,
                        AddressMaxMustermann.phoneNumber,
                        AddressMaxMustermann.country,
                        testEMail,
                        VatInvalid.id
                    ),
                },
            });

            await mutationResponse.verifyUpdateBillingAddressResponse(
                response,
                VatInvalid.id,
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.address,
                AddressMaxMustermann.companyName,
                AddressMaxMustermann.city,
                AddressMaxMustermann.postCode,
                AddressMaxMustermann.country,
                AddressMaxMustermann.phoneNumber,
                testEMail,
                true,
                null,
                null
            );
        });
    });
});
