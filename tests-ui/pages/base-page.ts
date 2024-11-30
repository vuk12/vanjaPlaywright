import { Page, Locator } from "@playwright/test";
import { CookieBanner } from "./shared-components/cookie-banner";
import { CountryLanguageSelector } from "./shared-components/country-language-selector";
import { ProgressIndicator } from "./shared-components/progress-indicator";
import { Footer } from "./shared-components/footer";

export class BasePage {
    readonly self: Page;
    readonly path: string;
    readonly title: string;
    readonly cookieBanner: CookieBanner;
    readonly countryLanguageSelector: CountryLanguageSelector;
    readonly progressIndicator: ProgressIndicator;
    readonly footer: Footer;

    readonly errorMessageText: Locator;

    constructor(page: Page, path: string, title?: string) {
        this.self = page;
        this.path = path;
        this.title = title!;
        this.cookieBanner = new CookieBanner(page);
        this.countryLanguageSelector = new CountryLanguageSelector(page);
        this.progressIndicator = new ProgressIndicator(page);
        this.footer = new Footer(page);

        this.errorMessageText = page.locator("label span.text-error-700");
    }

    async visit() {
        await this.self.goto(this.path);
    }

    async visitAndAcceptCookies() {
        await this.visit();
        await this.cookieBanner.acceptAllCookie();
    }
    
}
