import { Locator, Page, expect } from "@playwright/test";
import type { BrowserContext} from 'playwright-core';


export class Footer {
    readonly self: Locator;
    readonly clientName: Locator;
    readonly faqLink:Locator;
    readonly imprintLink:Locator;
    readonly termsLink:Locator;
    readonly privacyPolicyLink:Locator;

    constructor(page: Page) {
        this.self = page.locator("footer");
        this.clientName = this.self.locator("span").nth(0);
        this.faqLink = page.getByText("FAQ");
        this.imprintLink = page.getByText("Imprint");
        this.termsLink = page.getByText("Terms and Conditions");
        this.privacyPolicyLink = page.getByText("Privacy Policy");
    }

    async verifyClientName(clientName: string) {
        await expect(this.clientName).toHaveText(clientName);
    }

    async verifyFAQlinkIsDisplayed() {
        await expect(this.faqLink).toBeVisible();
    }

    async clickFAQlink() {
        await this.faqLink.click();
    }

    async verifyImprintLinkIsDisplayed() {
        await expect(this.imprintLink).toBeVisible();
    }

    async clickImprintLink() {
        await this.imprintLink.click();
    }

    async verifyTermsLinkIsDisplayed() {
        await expect(this.termsLink).toBeVisible();
    }

    async clickTermsLink() {
        await this.termsLink.click();
    }

    async verifyPrivacyPolicyLinkDisplayed() {
        await expect(this.privacyPolicyLink).toBeVisible();
    }

    async clickPrivacyPolicyLink() {
        await this.privacyPolicyLink.click();
    }

    async verifyAllLinksDisplayForBrazilShop(){
        await this.verifyFAQlinkIsDisplayed();
        await this.verifyImprintLinkIsDisplayed();
        await this.verifyPrivacyPolicyLinkDisplayed();
        await this.verifyTermsLinkIsDisplayed();
    }

    async verifyFAQlinkAndClose(context: BrowserContext, link: string){
        const pagePromise = context.waitForEvent('page');
        await this.clickFAQlink();
        const faqTab = await pagePromise;
        await faqTab.waitForLoadState();
        expect( faqTab.url().includes(link)).toBeTruthy();
        //await expect(faqTab).toHaveTitle(`tbd`);
        await faqTab.close();
    }

    async verifyImprintLinkAndClose(context: BrowserContext, link: string){
        const pagePromise = context.waitForEvent('page');
        await this.clickImprintLink();
        const imprintTab = await pagePromise;
        await imprintTab.waitForLoadState();
        expect( imprintTab.url().includes(link)).toBeTruthy();
        //await expect(imprintTab).toHaveURL(link);
        //await expect(imprintTab).toHaveTitle(`tbd`);
        await imprintTab.close();
    }

    async verifyTermsLinkAndClose(context: BrowserContext, link: string){
        const pagePromise = context.waitForEvent('page');
        await this.clickTermsLink();
        const termsTab = await pagePromise;
        await termsTab.waitForLoadState();
        expect(termsTab.url().includes(link)).toBeTruthy();
        //await expect(termsTab).toHaveURL(link);
        //await expect(termsTab).toHaveTitle(`tbd`);
        await termsTab.close();
    }

    async verifyPrivacyPolicyLinkAndClose(context: BrowserContext, link: string){
        const pagePromise = context.waitForEvent('page');
        await this.clickPrivacyPolicyLink();
        const privacyPolicyTab = await pagePromise;
        await privacyPolicyTab.waitForLoadState();
        expect(privacyPolicyTab.url().includes(link)).toBeTruthy();
        //await expect(privacyPolicyTab).toHaveURL(link);
        //await expect(privacyPolicyTab).toHaveTitle(`tbd`);
        await privacyPolicyTab.close();
    }

}
