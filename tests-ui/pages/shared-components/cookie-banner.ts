import { Locator, Page, expect } from "@playwright/test";

export class CookieBanner {
    readonly self: Locator;
    readonly acceptAllButton: Locator;

    constructor(page: Page) {
        this.self = page.locator("#cmpbox");
        this.acceptAllButton = page.locator("#cmpwelcomebtnyes");
    }

    async acceptAllCookie() {
        await expect(this.self).toBeVisible({timeout:10000});
        await this.acceptAllButton.click();
        await expect(this.self).not.toBeVisible();
    }
}
