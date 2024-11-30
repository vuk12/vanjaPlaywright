import { expect, test } from "@playwright/test";
import { QueryRequest } from "../requests/query-request";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import { ClientConfigBrazilDefault } from "../../../helper/cart-simulator";

const GRAPHQL_URL_BFF_BRAZIL = GQLUriBuilder(ClientConfigBrazilDefault);

test("billing countries are returned", async ({ request }) => {
    const queryRequest = new QueryRequest();
    const response = await request.post(GRAPHQL_URL_BFF_BRAZIL, {
        headers: {
            "content-type": "application/json",
        },
        data: {
            query: queryRequest.billingCountries(),
        },
    });

    const jsonResponse = await response.json();
    const billingCountries = jsonResponse.data.ConnectShop_BillingCountries;

    expect(billingCountries.length).toBeGreaterThan(0);
});

test("shipping countries are returned", async ({ request }) => {
    const queryRequest = new QueryRequest();
    const response = await request.post(GRAPHQL_URL_BFF_BRAZIL, {
        headers: {
            "content-type": "application/json",
        },
        data: {
            query: queryRequest.shippingCountries(),
        },
    });

    const jsonResponse = await response.json();
    const shippingCountries = jsonResponse.data.ConnectShop_ShippingCountries;

    expect(shippingCountries.length).toBeGreaterThan(0);
});

test("contact languages are correct", async ({ request }) => {
    const queryRequest = new QueryRequest();
    const response = await request.post(GRAPHQL_URL_BFF_BRAZIL, {
        headers: {
            "content-type": "application/json",
        },
        data: {
            query: queryRequest.contactLanguages(),
        },
    });

    expect(await response.json()).toEqual(
        expect.objectContaining({
            data: {
              ConnectShop_ContactLanguages: [
                {
                  code: "PT"
                },
                {
                  code: "EN"
                }
              ]
            }
          })
    );
});
