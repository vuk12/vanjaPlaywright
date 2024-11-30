import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../../../test-data/test-data";
import { MutationRequest } from "../requests/mutation-request";
import { MutationResponse } from "../requests/mutation-response";
import { StripePage } from "../../../tests-ui/pages/stripe-page";
import { QueryRequest } from "../requests/query-request";
import { GQLUriBuilder, Product, ProductFetcher } from "../../../helper/product-fetcher";
import { CartSimulator, ClientConfigGMBHDefault } from "../../../helper/cart-simulator";
import { getTestEmail } from "../../../test-data/emails";
import { AddressMaxMustermann } from "../../../test-data/address";
import { MailosaurService } from "../../../helper/mailosaur-service";
import { VatValid } from "../../../test-data/tax";
import { CreditCardSuccess } from "../../../test-data/credit-card";

const GRAPHQL_URL_BFF_GMBH = GQLUriBuilder(ClientConfigGMBHDefault);

/**
 * Contains the first product found from the API
 */
let testProduct: Product = {};

test.beforeAll(async ({ request }) => {
    const productRepository = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProduct = await productRepository.getProduct();
});

test("place an order, sepa", async ({ request }) => {
    const cart = new CartSimulator(ClientConfigGMBHDefault);
    const mutationRequest = new MutationRequest();
    const mutationResponse = new MutationResponse();
    const queryRequest = new QueryRequest();
    const mailosaurService = new MailosaurService();
    const testEMail = getTestEmail();
    const qty = 10 * testProduct.packageSize!;

    cart.add(testProduct, qty);
    const payment = {
        gateway: "sepa",
        method: "sepa",
        paymentProvider: "sepa",
    };

    await test.step("should be able to add product to the cart", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addProductToCart(testProduct.marketplaceCode!, qty, TEST_DATA.DEFAULT_DELIVERY),
            },
        });

        await mutationResponse.verifyAddToCartResponse(
            response,
            testProduct.price!.amount * qty,
            testProduct.price!.currency,
            testProduct.marketplaceCode!,
            testProduct.title!,
            10
        );
    });

    await test.step("should be a new customer", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.startVerification(testEMail),
            },
        });

        await mutationResponse.verifyStartVerificationResponse(response, true);
    });

    await test.step("registratration of a new customer is successful", async () => {
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

    await test.step("setting a delivery address as billing address is successful", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.setDeliveryAddressAsBillingAddress(TEST_DATA.DEFAULT_DELIVERY, true),
            },
        });
        await mutationResponse.verifyUpdateDeliveryAddressResponse(
            response,
            TEST_DATA.DEFAULT_DELIVERY,
            true,
            null,
            null
        );
    });

    await test.step("should add a sepa payment method", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addPayment(payment.gateway, payment.method),
            },
        });

        await mutationResponse.verifyUpdateSelectedPaymentResponse(response, true);
    });

    const uuid = await test.step("should place an order, return uuid", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.placeOrder("https://bff-service.bss.eu.dev.app.1nce-tech.net/graphql-console"),
            },
        });

        const jsonData = await response.json();
        const uuidJSON = await jsonData.data.Commerce_Checkout_StartPlaceOrder.uuid;
        expect(uuidJSON).toBeDefined();
        return uuidJSON;
    });

    await test.step("verify data", async () => {
        await expect
            .poll(
                async () => {
                    const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                        data: {
                            query: queryRequest.currentContext(),
                        },
                    });

                    const jsonData = await response.json();
                    const stateName = jsonData.data.Commerce_Checkout_CurrentContext.state.name;

                    return stateName == "ConnectShopSuccess";
                },
                {
                    timeout: 15000,
                }
            )
            .toBeTruthy();

        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.currentContext(),
            },
        });

        // Define attributes
        const jsonData = await response.json();
        const currentContext = await jsonData.data.Commerce_Checkout_CurrentContext;
        const paymentInfos = await currentContext.orderInfos.paymentInfos[0];
        const orderNumber = await currentContext.orderInfos.placedOrderInfos[0].orderNumber;

        expect(paymentInfos).toEqual(
            expect.objectContaining({
                gateway: payment.gateway,
                paymentProvider: payment.paymentProvider,
                method: payment.method,
                amount: {
                    amount: cart.grandTotalWithTax(), //@todo this calculation could be very flaky
                    currency: testProduct.price!.currency,
                },
            })
        );

        expect(await currentContext.uuid).toEqual(uuid);
        expect(await currentContext.orderInfos.email).toEqual(testEMail);
        expect(orderNumber).toBeDefined();
        console.log("The order number: " + orderNumber);
    });
});

test("place an order, stripe", async ({ request, page }) => {
    const mutationRequest = new MutationRequest();
    const mutationResponse = new MutationResponse();
    const queryRequest = new QueryRequest();
    const mailosaurService = new MailosaurService();
    const testEMail = getTestEmail();
    const qty = 10;

    const payment = {
        gateway: "stripe",
        method: "stripe",
        paymentProvider: "stripe",
    };

    await test.step("should be able to add product to the cart", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addProductToCart(testProduct.marketplaceCode!, qty, TEST_DATA.DEFAULT_DELIVERY),
            },
        });

        await mutationResponse.verifyAddToCartResponse(
            response,
            testProduct.price!.amount * qty,
            testProduct.price!.currency,
            testProduct.marketplaceCode!,
            testProduct.title!,
            qty
        );
    });

    await test.step("should be a new customer", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.startVerification(testEMail),
            },
        });

        await mutationResponse.verifyStartVerificationResponse(response, true);
    });

    await test.step("registratration of a new customer is successful", async () => {
        const confirmtaionCode = await mailosaurService.getConfirmationCode(testEMail);

        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.finishVerification(
                    AddressMaxMustermann.firstName,
                    AddressMaxMustermann.lastName,
                    confirmtaionCode!,
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

    await test.step("setting a delivery address as billing address is successful", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.setDeliveryAddressAsBillingAddress(TEST_DATA.DEFAULT_DELIVERY, true),
            },
        });
        await mutationResponse.verifyUpdateDeliveryAddressResponse(
            response,
            TEST_DATA.DEFAULT_DELIVERY,
            true,
            null,
            null
        );
    });

    await test.step("should add a stripe payment method", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addPayment(payment.gateway, payment.method),
            },
        });

        await mutationResponse.verifyUpdateSelectedPaymentResponse(response, true);
    });

    const uuid = await test.step("should place an order, return uuid", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.placeOrder("https://bff-service.bss.eu.dev.app.1nce-tech.net/graphql-console"),
            },
        });

        const jsonData = await response.json();
        const uuidJSON = await jsonData.data.Commerce_Checkout_StartPlaceOrder.uuid;
        expect(uuidJSON).toBeDefined();
        return uuidJSON;
    });

    const stripeUrl = await test.step("get stripe url", async () => {
        await expect
            .poll(
                async () => {
                    const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                        data: {
                            query: queryRequest.currentContext(),
                        },
                    });

                    const jsonData = await response.json();
                    const stateName = jsonData.data.Commerce_Checkout_CurrentContext.state.name;

                    return stateName == "Redirect";
                },
                {
                    timeout: 15000,
                }
            )
            .toBeTruthy();
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.currentContext(),
            },
        });
        const jsonData = await response.json();
        const stripe = await jsonData.data.Commerce_Checkout_CurrentContext.state.URL;
        return stripe;
    });

    await test.step("Stripe page", async () => {
        const stripePage = new StripePage(page);
        await page.goto(stripeUrl);
        await stripePage.verifyEmail(testEMail);
        await stripePage.fillOutRequiredCardData(
            CreditCardSuccess.number,
            CreditCardSuccess.expireDate,
            CreditCardSuccess.cvc,
            CreditCardSuccess.holder
        );
        await stripePage.verifyPaymentIsSuccessful();
        await page.close();
    });

    await test.step("verify data", async () => {
        await expect
            .poll(
                async () => {
                    const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                        data: {
                            query: queryRequest.currentContext(),
                        },
                    });

                    const jsonData = await response.json();
                    const stateName = jsonData.data.Commerce_Checkout_CurrentContext.state.name;

                    return stateName == "ConnectShopSuccess";
                },
                {
                    timeout: 15000,
                }
            )
            .toBeTruthy();

        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.currentContext(),
            },
        });

        // Define attributes
        const jsonData = await response.json();
        const currentContext = await jsonData.data.Commerce_Checkout_CurrentContext;
        const paymentInfos = await currentContext.orderInfos.paymentInfos[0];
        const orderNumber = await currentContext.orderInfos.placedOrderInfos[0].orderNumber;

        expect(paymentInfos).toEqual(
            expect.objectContaining({
                gateway: payment.gateway,
                paymentProvider: payment.paymentProvider,
                method: payment.method,
                amount: {
                    amount: Math.round((((testProduct.price!.amount * qty + 6.99) * 100) / 100) * 119) / 100,
                    currency: testProduct.price!.currency,
                },
            })
        );
        expect(await currentContext.uuid).toEqual(uuid);
        expect(await currentContext.orderInfos.email).toEqual(testEMail);
        expect(orderNumber).toBeDefined();
        console.log("The order number: " + orderNumber);
    });
});
