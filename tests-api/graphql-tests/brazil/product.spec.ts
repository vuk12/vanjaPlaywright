import { expect, test } from "@playwright/test";
import { QueryRequest } from "../requests/query-request";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import { ClientConfigBrazilDefault } from "../../../helper/cart-simulator";

//TODO: ADD more test and assertions later
const GRAPHQL_URL_BFF_BRAZIL = GQLUriBuilder(ClientConfigBrazilDefault);

test("Products are returned", async ({ request }) => {
    const queryRequest = new QueryRequest();
    const response = await request.post(GRAPHQL_URL_BFF_BRAZIL, {
        headers: {
            "content-type": "application/json",
        },
        data: {
            query: queryRequest.searchProduct(),
        },
    });

    const jsonResponse = await response.json();
    const brazilProducts = jsonResponse.data.Commerce_Product_Search.products;

    expect(brazilProducts.length).toBeGreaterThan(1);
});

