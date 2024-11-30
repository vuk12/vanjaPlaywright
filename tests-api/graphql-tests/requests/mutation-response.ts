import { APIResponse } from "@playwright/test";
import { verifyGQLResponse } from "../../../helper/graphql-helper";

export class MutationResponse {
    async verifyAddToCartResponse(
        response: APIResponse,
        amount: number,
        currency: string,
        marketplaceCode: string,
        productName: string,
        qty: number
    ) {
        await verifyGQLResponse(response, {
            Commerce_Cart_AddToCart: {
                cart: {
                    grandTotal: {
                        amount: amount,
                        currency: currency,
                    },
                    deliveries: [
                        {
                            cartitems: [
                                {
                                    marketplaceCode: marketplaceCode,
                                    productName: productName,
                                    qty: qty,
                                },
                            ],
                        },
                    ],
                },
            },
        });
    }

    async verifyStartVerificationResponse(response: APIResponse, successful: boolean) {
        await verifyGQLResponse(response, {
            ConnectShop_Verification_StartVerification: successful,
        });
    }

    async verifyFinishVerificationResponse(response: APIResponse, processed: boolean) {
        await verifyGQLResponse(response, {
            ConnectShop_Verification_FinishVerification: {
                processed: processed,
            },
        });
    }

    async verifyUpdateBillingAddressResponse(
        response: APIResponse,
        vat: string,
        firstName: string,
        lastname: string,
        addressLine1: string,
        company: string,
        city: string,
        postCode: string,
        countryCode: string,
        phoneNumber: string,
        email: string,
        processed: boolean,
        fieldErrors: unknown,
        generalErrors: unknown
    ) {
        await verifyGQLResponse(response, {
            Commerce_Cart_UpdateBillingAddress: {
                formData: {
                    vat: vat,
                    firstname: firstName,
                    lastname: lastname,
                    addressLine1: addressLine1,
                    company: company,
                    city: city,
                    postCode: postCode,
                    countryCode: countryCode,
                    phoneNumber: phoneNumber,
                    email: email,
                },
                processed: processed,
                validationInfo: {
                    fieldErrors: fieldErrors,
                    generalErrors: generalErrors,
                },
            },
        });
    }

    async verifyUpdateDeliveryAddressResponse(
        response: APIResponse,
        deliveryCode: string,
        processed: boolean,
        fieldErrors: unknown,
        generalErrors: unknown
    ) {
        await verifyGQLResponse(response, {
            Commerce_Cart_UpdateDeliveryAddresses: [
                {
                    deliveryCode: deliveryCode,
                    processed: processed,
                    validationInfo: {
                        fieldErrors: fieldErrors,
                        generalErrors: generalErrors,
                    },
                },
            ],
        });
    }

    async verifyUpdateSelectedPaymentResponse(response: APIResponse, processed: boolean) {
        await verifyGQLResponse(response, {
            Commerce_Cart_UpdateSelectedPayment: {
                processed: processed,
            },
        });
    }

    async verifyUpdateAdditionalDataResponse(response: APIResponse, typename: string) {
        await verifyGQLResponse(response, {
            Commerce_Cart_UpdateAdditionalData: {
                __typename: typename,
            },
        });
    }
}
