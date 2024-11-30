import { Locator, Page } from "@playwright/test";

export class ProgressIndicator {
    readonly configurationStep: Locator;
    readonly registrationStep: Locator;
    readonly addAddressStep: Locator;
    readonly finalizeStep: Locator;

    constructor(page: Page) {
        this.configurationStep = page.getByTestId("processIndicatorStep0");
        this.registrationStep = page.getByTestId("processIndicatorStep1");
        this.addAddressStep = page.getByTestId("processIndicatorStep2");
        this.finalizeStep = page.getByTestId("processIndicatorStep3");
    }
}
