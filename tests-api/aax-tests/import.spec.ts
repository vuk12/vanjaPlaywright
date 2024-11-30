import { test, expect } from "@playwright/test";

const baseURL = process.env.BASE_URL_BFF;
const gmbh = "/gmbh";
const connectShopImport = "/connect-shop/import";
const importAll = gmbh + connectShopImport + "/all";

test("@local should trigger aax import of all data", async ({ request }) => {
    const response = await request.post(baseURL + importAll, {
        headers: {
            "X-Request-id": "200",
        },
    });
    const jsonResponse = await response.json();
    expect(response.status()).toBe(200);
    expect(jsonResponse).toContain("import:billing-countries - import successful");
    expect(jsonResponse).toContain("import:shipping-countries - import successful");
    expect(jsonResponse).toContain("import:products - import successful");
});
