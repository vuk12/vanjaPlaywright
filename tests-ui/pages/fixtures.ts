import { test as base } from '@playwright/test';
import { ConfigurationPage } from './configuration-page';
import { RegisterOrLoginPage } from './register-or-login-page';
import { RegisterPage } from './register-page';
import { ConfirmationPage } from './confirmation-page';
import { BillingAndDeliveryPage } from './billing-and-delivery-page';
import { CheckoutPage } from './checkout-page';
import { StripePage } from './stripe-page';


type ShopPages = {
    configurationPage: ConfigurationPage;
    registerOrLoginPage: RegisterOrLoginPage;
    registerPage: RegisterPage;
    confirmationPage:ConfirmationPage;
    billingAndDeliveryPage:BillingAndDeliveryPage;
    checkoutPage:CheckoutPage;
    stripePage:StripePage;
};

export const test = base.extend<ShopPages>({
    configurationPage: async ({ page }, use) => {
      await use(new ConfigurationPage(page));
    },
  
    registerOrLoginPage: async ({ page }, use) => {
      await use(new RegisterOrLoginPage(page));
    },

    registerPage: async ({ page }, use) => {
        await use(new RegisterPage(page));
      },

      confirmationPage: async ({ page }, use) => {
        await use(new ConfirmationPage(page));
      },

      billingAndDeliveryPage: async ({ page }, use) => {
        await use(new BillingAndDeliveryPage(page));
      },

      checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
      },

      stripePage: async ({ page }, use) => {
        await use(new StripePage(page));
      },

  });

  export { expect } from '@playwright/test';