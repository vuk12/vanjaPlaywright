import { test } from "@playwright/test";
import { getTestEmail } from "../../../test-data/emails";
import { TEST_DATA } from "../../../test-data/test-data";
import { MutationRequest } from "../requests/mutation-request";
import { QueryRequest } from "../requests/query-request";
import { QueryResponse } from "../requests/query-response";
import { APIRequestContext } from "playwright-core";
import { GQLUriBuilder, Product, ProductFetcher } from "../../../helper/product-fetcher";
import { CartSimulator, ClientConfigGMBHDefault, ClientConfigPTEDefault } from "../../../helper/cart-simulator";
import { AddressMaxMustermann } from "../../../test-data/address";
import { VatValid } from "../../../test-data/tax";
import { MailosaurService } from "../../../helper/mailosaur-service";

const GRAPHQL_URL_BFF_GMBH = GQLUriBuilder(ClientConfigGMBHDefault);
const mutationRequest = new MutationRequest();
const queryRequest = new QueryRequest();
const queryResponse = new QueryResponse();
const mailosaurService = new MailosaurService();

type payment = {
    gateway: string;
    method: string;
    paymentProvider: string;
};

const paymentSEPA = {
    gateway: "sepa",
    method: "sepa",
    paymentProvider: "sepa",
};

const paymentSTRIPE = {
    gateway: "stripe",
    method: "stripe",
    paymentProvider: "stripe",
};

/**
 * Contains the first product found from the API
 */
let testProduct: Product = {};
let testProductPTE: Product = {};

/**
 * Contains a product with packageSize > 1 (so we can test package size validation)
 */
let testProduct2: Product = {};

/**
 * Contains a mail address which is randomly created before each test.
 */
let testEMail: string;

test.describe.configure({mode: `parallel`});

test.beforeEach(async () => {
    testEMail = getTestEmail();
});

test.beforeAll(async ({ request }) => {
    const productRepository = new ProductFetcher(request, ClientConfigGMBHDefault);
    const productRepositoryPTE = new ProductFetcher(request, ClientConfigPTEDefault);
    testProduct = await productRepository.getProduct();
    testProduct2 = await productRepository.getProductWithTestablePackageSize();
    testProductPTE = await productRepositoryPTE.getProduct();
});

test("it must not be possible to order more than maxQty", async ({ request }) => {
    const tooManyItems = testProduct.maxQty! + 1;

    await test.step("prepare cart (add to many items)", async () => {
        await test.step("add to cart", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(
                        testProduct.marketplaceCode!,
                        tooManyItems,
                        TEST_DATA.DEFAULT_DELIVERY
                    ),
                },
            });
        });
    });

    await runDefaultSteps(request, paymentSEPA);

    await test.step("run the validations", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.validateCart(),
            },
        });

        const expectedMsg =
            "ordered quantity (" + tooManyItems + ") is higher than allowed (" + testProduct.maxQty + ")";
        await queryResponse.containsItemErrorMessage(expectedMsg, response);
    });
});

test("products of different clients are not allowed", async ({ request }) => {
    await test.step("prepare user and cart", async () => {
        await test.step("add testProduct of PTE client to GMBH cart", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(
                        testProductPTE.marketplaceCode!,
                        10,
                        TEST_DATA.DEFAULT_DELIVERY
                    ),
                },
            });
        });
    });

    await runDefaultSteps(request, paymentSEPA);

    await test.step("run the validations", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.validateCart(),
            },
        });

        await queryResponse.containsItemErrorMessage("invalid_products_for_this_client", response);
    });
});

test("credit card limit is checked", async ({ request }) => {
    const cart = new CartSimulator(ClientConfigGMBHDefault);
    await test.step("prepare user and cart", async () => {
        await test.step("add products for more than 10000 currency to the cart", async () => {
            const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(
                        testProduct.marketplaceCode!,
                        cart.qtyForAmountBiggerThan(testProduct, 10000),
                        TEST_DATA.DEFAULT_DELIVERY
                    ),
                },
            });
            test.expect(response.ok()).toBeTruthy();
        });
    });

    await runDefaultSteps(request, paymentSTRIPE);

    await test.step("run the validations", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.validateCart(),
            },
        });

        await queryResponse.containsItemErrorMessage("paymentNotAllowed", response);
    });
});

test("quantity does not match packagesize", async ({ request }) => {
    const wrongPackageSizeQty = testProduct2.packageSize! + 1;

    await test.step("prepare user and cart", async () => {
        await test.step("add products with wrong packageSize", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(
                        testProduct2.marketplaceCode!,
                        wrongPackageSizeQty,
                        TEST_DATA.DEFAULT_DELIVERY
                    ),
                },
            });
        });

        await test.step("should add a sepa paymentSEPA method", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addPayment("stripe", "stripe"),
                },
            });
        });
    });

    await runDefaultSteps(request, paymentSEPA);

    await test.step("overwrite paymentSEPA to stripe", async () => {
        await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addPayment("stripe", "stripe"),
            },
        });
    });

    await test.step("run the validations", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.validateCart(),
            },
        });
        await queryResponse.containsItemErrorMessage(
            "qty in cart (101) does not match with allowed packageSize (100)",
            response
        );
    });
});

test("only one delivery should be in the cart", async ({ request }) => {
    await test.step("prepare user and cart", async () => {
        await test.step("add products with deliveryCode", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(testProduct.marketplaceCode!, 10, "something"),
                },
            });
        });

        await test.step("add products with another deliveryCode", async () => {
            await request.post(GRAPHQL_URL_BFF_GMBH, {
                data: {
                    query: mutationRequest.addProductToCart(testProduct.marketplaceCode!, 10, "something_else"),
                },
            });
        });
    });

    await runDefaultSteps(request, paymentSEPA);

    await test.step("run the validations", async () => {
        const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: queryRequest.validateCart(),
            },
        });
        await queryResponse.containsItemErrorMessage("cart is only allowed to have one delivery", response);
    });
});

/**
 * There are a couple of steps that are necessary to run the validations in each step.
 * @param request
 * @param p
 */
function runDefaultSteps(request: APIRequestContext, p: payment): Promise<unknown> {
    return test.step("run necessary queries (create user, registration...)", async () => {
        let response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.startVerification(testEMail),
            },
        });
        test.expect(response.ok()).toBeTruthy();

        const confirmationCode = await mailosaurService.getConfirmationCode(testEMail);

        response = await request.post(GRAPHQL_URL_BFF_GMBH, {
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
        test.expect(response.ok()).toBeTruthy();

        response = await request.post(GRAPHQL_URL_BFF_GMBH, {
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

        response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.setDeliveryAddressAsBillingAddress(TEST_DATA.DEFAULT_DELIVERY, true),
            },
        });
        test.expect(response.ok()).toBeTruthy();

        response = await request.post(GRAPHQL_URL_BFF_GMBH, {
            data: {
                query: mutationRequest.addPayment(p.gateway, p.method),
            },
        });
        test.expect(response.ok()).toBeTruthy();
    });
}
