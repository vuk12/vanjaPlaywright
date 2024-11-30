import { expect, test } from "@playwright/test";
import { TEST_DATA } from "../../../test-data/test-data";
import { QueryRequest } from "../requests/query-request";
import { GQLUriBuilder } from "../../../helper/product-fetcher";
import { ClientConfigGMBHDefault } from "../../../helper/cart-simulator";
import { BillingCountryGermany } from "../../../test-data/billing-countries";
import { EnvHelper } from "../../../helper/env-helper";

const GRAPHQL_URL_BFF_GMBH = GQLUriBuilder(ClientConfigGMBHDefault);

test("maxmind works properly", async ({ request }) => {
    test.skip(EnvHelper.isStaging(), "Skip for staging, works only against mocks");
    const queryRequest = new QueryRequest();
    const response = await request.post(GRAPHQL_URL_BFF_GMBH, {
        headers: {
            "content-type": "application/json",
            "x-forwarded-for": TEST_DATA.DE_IP,
        },
        data: {
            query: queryRequest.getIPLocation(),
        },
    });

    expect(await response.json()).toEqual(
        expect.objectContaining({
            data: {
                Commerce_IPLocation: {
                    countryCode: BillingCountryGermany.code,
                },
            },
        })
    );
});
