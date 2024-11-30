import { test, expect } from "../pages/fixtures";
import { getTestEmail } from "../../test-data/emails";
import { CartSimulator, ClientConfigGMBHDefault, ClientConfigPTESingapore } from "../../helper/cart-simulator";
import { Product, ProductFetcher } from "../../helper/product-fetcher";
import { BillingCountryGermany, BillingCountrySingapore } from "../../test-data/billing-countries";
import { getCountryName } from "../../helper/country-service";
import { DisplayLanguageEnglish, DisplayLanguageGerman } from "../../test-data/display-languages";
import { AddressErikaMusterfrau, AddressIvanIvanov, AddressMaxMustermann } from "../../test-data/address";
import { VatValid } from "../../test-data/tax";
import { MailosaurService } from "../../helper/mailosaur-service";
import { TEST_DATA } from "../../test-data/test-data";
import { ProductInCart } from "../../test-data/product-in-cart";

let testProductGMBH1: Product = {};
let testProductGMBH2: Product = {};
let testProductPTE1: Product = {};
let testProductPTE2: Product = {};

test.beforeAll(async ({ request }) => {
    const productRepositoryGMBH = new ProductFetcher(request, ClientConfigGMBHDefault);
    testProductGMBH1 = await productRepositoryGMBH.getProduct();
    testProductGMBH2 = await productRepositoryGMBH.getProduct();
    const productRepositoryPTE = new ProductFetcher(request, ClientConfigPTESingapore);
    testProductPTE1 = await productRepositoryPTE.getProduct();
    testProductPTE2 = await productRepositoryPTE.getProduct();
});

test.describe("@local gmbh, edit value of", () => {
    let product1: ProductInCart;
    let product2: ProductInCart;
    const Germany = getCountryName(DisplayLanguageGerman.code, BillingCountryGermany.code)!;
    test.beforeEach(async ({ page, configurationPage, registerPage, registerOrLoginPage, billingAndDeliveryPage, checkoutPage}) => {

        const mailosaurService = new MailosaurService();
        const testEmail = getTestEmail();

        const cartGMBH = new CartSimulator(ClientConfigGMBHDefault);

        const clickCountP1 = 4;
        const clickCountP2 = 3;

        cartGMBH.add(testProductGMBH1, clickCountP1 * testProductGMBH1.packageSize!);
        cartGMBH.add(testProductGMBH2, clickCountP2 * testProductGMBH2.packageSize!);

        product1 = {
            marketPlaceCode: testProductGMBH1.marketplaceCode!,
            clickCount: clickCountP1,
            countOfItems: cartGMBH.getItem(testProductGMBH1.marketplaceCode!).qty.toString(),
            totalPrice: cartGMBH.asCurrencyString(cartGMBH.totalAmountByItemRaw(testProductGMBH1.marketplaceCode!)),
        };

        product2 = {
            marketPlaceCode: testProductGMBH2.marketplaceCode!,
            clickCount: clickCountP2,
            countOfItems: cartGMBH.getItem(testProductGMBH2.marketplaceCode!).qty.toString(),
            totalPrice: cartGMBH.asCurrencyString(cartGMBH.totalAmountByItemRaw(testProductGMBH2.marketplaceCode!)),
        };

        await test.step("configuration page -> add product", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                BillingCountryGermany.code
            );
            await configurationPage.countryLanguageSelector.chooseDisplayLanguage(page, DisplayLanguageGerman.code);

            await configurationPage.addProductByMarketPlaceCode(page, product1.marketPlaceCode, product1.clickCount);
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.totalPrice
            );
            await configurationPage.addProductByMarketPlaceCode(page, product2.marketPlaceCode, product2.clickCount);
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product2.marketPlaceCode,
                product2.totalPrice
            );
            await configurationPage.submitButton.click();
        });

        await test.step("register or login page -> fill out data", async () => {
            await registerOrLoginPage.fillEmail(testEmail, page);
            await registerOrLoginPage.submitButton.click();
        });

        await test.step("register page -> fill out data", async () => {
            await registerPage.verifyEmailAddress(testEmail);
            const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);

            await registerPage.fillOutRequiredData(
                confirmationCode!,
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await registerPage.submitButton.click();
        });

        await test.step("billing and delivery page -> fill out data", async () => {
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.phoneNumberInput.fill(AddressMaxMustermann.phoneNumber);
            await billingAndDeliveryPage.mainAddressInput.fill(AddressMaxMustermann.address);
            await billingAndDeliveryPage.cityInput.fill(AddressMaxMustermann.city);
            await billingAndDeliveryPage.postCodeInput.fill(AddressMaxMustermann.postCode);
            await billingAndDeliveryPage.vatInput.fill(VatValid.id);

            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page -> wait on all data", async () => {
            await checkoutPage.verifyBillingAddressData(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName,
                AddressMaxMustermann.address,
                AddressMaxMustermann.postCode,
                AddressMaxMustermann.city,
                Germany
            );
            await checkoutPage.verifyVatId(VatValid.id);
            await checkoutPage.verifyPhoneNumber(AddressMaxMustermann.phoneNumber);
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.totalPrice
            );
        });
    });

    test("billing address works properly", async ({ billingAndDeliveryPage, checkoutPage  }) => {
        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.billingAddressContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> edit data", async () => {
            // Wait until data is loaded
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.verifyPrefilledPhoneNumber(AddressMaxMustermann.phoneNumber);
            await billingAndDeliveryPage.verifyPrefilledVAT(VatValid.id);

            // Change billing address data
            await billingAndDeliveryPage.firstNameInput.fill(AddressErikaMusterfrau.firstName);
            await billingAndDeliveryPage.lastNameInput.fill(AddressErikaMusterfrau.lastName);
            await billingAndDeliveryPage.companyInput.fill(AddressErikaMusterfrau.companyName);
            await billingAndDeliveryPage.mainAddressInput.fill(AddressErikaMusterfrau.address);
            await billingAndDeliveryPage.cityInput.fill(AddressErikaMusterfrau.city);
            await billingAndDeliveryPage.postCodeInput.fill(AddressErikaMusterfrau.postCode);

            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify billing and shipping data were updated", async () => {
            await checkoutPage.verifyBillingAddressData(
                AddressErikaMusterfrau.firstName,
                AddressErikaMusterfrau.lastName,
                AddressErikaMusterfrau.companyName,
                AddressErikaMusterfrau.address,
                AddressErikaMusterfrau.postCode,
                AddressErikaMusterfrau.city,
                Germany
            );

            await checkoutPage.verifyShippingAddressData(
                AddressErikaMusterfrau.firstName,
                AddressErikaMusterfrau.lastName,
                AddressErikaMusterfrau.companyName,
                AddressErikaMusterfrau.address,
                AddressErikaMusterfrau.postCode,
                AddressErikaMusterfrau.city,
                Germany
            );
        });
    });

    test("shipping address works properly", async ({ page, billingAndDeliveryPage, checkoutPage  }) => {
        const United_Kingdom = getCountryName(DisplayLanguageGerman.code, AddressErikaMusterfrau.country)!;

        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.shippingAddressContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> edit shipping address", async () => {
            // Wait until data is loaded
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.shippingIsDifferentCheckbox.click();

            await billingAndDeliveryPage.shippingFirstNameInput.fill(AddressErikaMusterfrau.firstName);
            await billingAndDeliveryPage.shippingLastNameInput.fill(AddressErikaMusterfrau.lastName);
            await billingAndDeliveryPage.shippingCompanyInput.fill(AddressErikaMusterfrau.companyName);
            await billingAndDeliveryPage.receiverPhoneNumberInput.fill(AddressErikaMusterfrau.phoneNumber);
            await billingAndDeliveryPage.shippingMainAddressInput.fill(AddressErikaMusterfrau.address);
            await billingAndDeliveryPage.shippingCityInput.fill(AddressErikaMusterfrau.city);
            await billingAndDeliveryPage.shippingPostCodeInput.fill(AddressErikaMusterfrau.postCode);
            await billingAndDeliveryPage.chooseShippingCountry(page, AddressErikaMusterfrau.country);
            await expect(billingAndDeliveryPage.shippingCountryDropbox).toHaveText(United_Kingdom);

            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify billing and shipping data were updated", async () => {
            await checkoutPage.verifyBillingAddressData(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName,
                AddressMaxMustermann.address,
                AddressMaxMustermann.postCode,
                AddressMaxMustermann.city,
                Germany
            );

            await checkoutPage.verifyShippingAddressData(
                AddressErikaMusterfrau.firstName,
                AddressErikaMusterfrau.lastName,
                AddressErikaMusterfrau.companyName,
                AddressErikaMusterfrau.address,
                AddressErikaMusterfrau.postCode,
                AddressErikaMusterfrau.city,
                United_Kingdom
            );
            await checkoutPage.verifyPhoneNumber(AddressErikaMusterfrau.phoneNumber);
        });
    });

    test("VAT ID works properly", async ({ billingAndDeliveryPage, checkoutPage  }) => {

        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.vatIdContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> click hasNoVat checkbox", async () => {
            // Wait until data is loaded
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.verifyPrefilledPhoneNumber(AddressMaxMustermann.phoneNumber);
            await billingAndDeliveryPage.verifyPrefilledVAT(VatValid.id);

            await billingAndDeliveryPage.selectHasNoVatCheckbox();
            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify VAT ID container is empty", async () => {
            await expect(checkoutPage.vatIdContainer).not.toContainText(VatValid.id);
        });
    });

    test("phone number works properly", async ({ billingAndDeliveryPage, checkoutPage }) => {

        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.phoneNumberContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> edit phone number", async () => {
            // Wait until data is loaded
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.verifyPrefilledPhoneNumber(AddressMaxMustermann.phoneNumber);
            await billingAndDeliveryPage.verifyPrefilledVAT(VatValid.id);

            await billingAndDeliveryPage.phoneNumberInput.fill(AddressErikaMusterfrau.phoneNumber);
            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify phone number was updated", async () => {
            await checkoutPage.verifyPhoneNumber(AddressErikaMusterfrau.phoneNumber);
        });
    });

    test("customer reference works properly", async ({ billingAndDeliveryPage, checkoutPage }) => {

        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.customerReferenceContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> edit phone number", async () => {
            // Wait until data is loaded
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressMaxMustermann.firstName,
                AddressMaxMustermann.lastName,
                AddressMaxMustermann.companyName
            );
            await billingAndDeliveryPage.verifyPrefilledPhoneNumber(AddressMaxMustermann.phoneNumber);
            await billingAndDeliveryPage.verifyPrefilledVAT(VatValid.id);

            await billingAndDeliveryPage.customerReferenceInput.fill(TEST_DATA.CUSTOMER_REFERENCE);
            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify phone number was updated", async () => {
            await expect(checkoutPage.customerReferenceContainer).toContainText(TEST_DATA.CUSTOMER_REFERENCE);
        });
    });

    test("product works properly", async ({ page, configurationPage, billingAndDeliveryPage, checkoutPage }) => {
        const cartGMBH_edited = new CartSimulator(ClientConfigGMBHDefault);

        /**
         * Given 4 clicks of product
         * Should decrement 1
         * Result: 3 Counts
         */
        const clickCountP1_decrement = 1;
        const clickCountP1_edited = 3;

        cartGMBH_edited.add(testProductGMBH1, clickCountP1_edited * testProductGMBH1.packageSize!);

        const product1_edit_decrement = {
            marketPlaceCode: testProductGMBH1.marketplaceCode!,
            clickCount: clickCountP1_decrement,
            countOfItems: cartGMBH_edited.getItem(testProductGMBH1.marketplaceCode!).qty.toString(),
            totalPrice: cartGMBH_edited.asCurrencyString(
                cartGMBH_edited.totalAmountByItemRaw(testProductGMBH1.marketplaceCode!)
            ),
        };

        await test.step("checkout page, go to configuration page using edit button", async () => {
            await checkoutPage.editProductByMarketPlaceCode(page, product1_edit_decrement.marketPlaceCode);
        });

        await test.step("configuration page is open -> edit phone number", async () => {
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.countOfItems
            );
            await configurationPage.subtractProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.clickCount
            );
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.countOfItems
            );

            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.totalPrice
            );

            await configurationPage.submitButton.click();
            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify phone number was updated", async () => {
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.totalPrice
            );
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product2.marketPlaceCode,
                product2.totalPrice
            );
        });
    });
});

test.describe("pte, edit value of", () => {
    let product1: ProductInCart;
    let product2: ProductInCart;

    test.beforeEach(async ({ page, configurationPage, registerOrLoginPage, registerPage, billingAndDeliveryPage, checkoutPage }) => {
        const cartPTE = new CartSimulator(ClientConfigPTESingapore);
        const testEmail = getTestEmail();
        const mailosaurService = new MailosaurService();
        const Singapore = getCountryName(DisplayLanguageEnglish.code, BillingCountrySingapore.code)!;
        const clickCountP1 = 4;
        const clickCountP2 = 3;

        cartPTE.add(testProductPTE1, clickCountP1 * testProductPTE1.packageSize!);
        cartPTE.add(testProductPTE2, clickCountP2 * testProductPTE2.packageSize!);

        product1 = {
            marketPlaceCode: testProductPTE1.marketplaceCode!,
            clickCount: clickCountP1,
            countOfItems: cartPTE.getItem(testProductPTE1.marketplaceCode!).qty.toString(),
            totalPrice: cartPTE.asCurrencyString(cartPTE.totalAmountByItemRaw(testProductPTE1.marketplaceCode!)),
        };

        product2 = {
            marketPlaceCode: testProductPTE2.marketplaceCode!,
            clickCount: clickCountP2,
            countOfItems: cartPTE.getItem(testProductPTE2.marketplaceCode!).qty.toString(),
            totalPrice: cartPTE.asCurrencyString(cartPTE.totalAmountByItemRaw(testProductPTE2.marketplaceCode!)),
        };

        await test.step("configuration page -> add product", async () => {
            await configurationPage.visitAndAcceptCookies();
            await configurationPage.countryLanguageSelector.chooseBillingCountryFromHeader(
                page,
                BillingCountrySingapore.code
            );

            await configurationPage.addProductByMarketPlaceCode(page, product1.marketPlaceCode, product1.clickCount);
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.totalPrice
            );
            await configurationPage.addProductByMarketPlaceCode(page, product2.marketPlaceCode, product2.clickCount);
            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product2.marketPlaceCode,
                product2.totalPrice
            );
            await configurationPage.submitButton.click();
        });

        await test.step("register or login page -> fill out data", async () => {
            await registerOrLoginPage.fillEmail(testEmail, page);
            await registerOrLoginPage.submitButton.click();
        });

        await test.step("register page -> fill out data", async () => {
            await registerPage.verifyEmailAddress(testEmail);
            const confirmationCode = await mailosaurService.getConfirmationCode(testEmail);

            await registerPage.fillOutRequiredData(
                confirmationCode!,
                AddressIvanIvanov.firstName,
                AddressIvanIvanov.lastName,
                AddressIvanIvanov.companyName
            );
            await registerPage.submitButton.click();
        });

        await test.step("billing and delivery page -> fill out data", async () => {
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressIvanIvanov.firstName,
                AddressIvanIvanov.lastName,
                AddressIvanIvanov.companyName
            );
            await billingAndDeliveryPage.phoneNumberInput.fill(AddressIvanIvanov.phoneNumber);
            await billingAndDeliveryPage.mainAddressInput.fill(AddressIvanIvanov.address);
            await billingAndDeliveryPage.cityInput.fill(AddressIvanIvanov.city);
            await billingAndDeliveryPage.postCodeInput.fill(AddressIvanIvanov.postCode);

            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page -> wait on all data", async () => {
            await checkoutPage.verifyBillingAddressData(
                AddressIvanIvanov.firstName,
                AddressIvanIvanov.lastName,
                AddressIvanIvanov.companyName,
                AddressIvanIvanov.address,
                AddressIvanIvanov.postCode,
                AddressIvanIvanov.city,
                Singapore
            );
            await checkoutPage.verifyPhoneNumber(AddressIvanIvanov.phoneNumber);
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.totalPrice
            );
        });
    });

    test("VAT ID works properly", async ({ billingAndDeliveryPage, checkoutPage }) => {

        await test.step("checkout page, go to billing and delivery page using edit button", async () => {
            await checkoutPage.vatIdContainer.locator(checkoutPage.editButton).click();
        });

        await test.step("billing and delivery page is open -> click hasNoVat checkbox", async () => {
            await billingAndDeliveryPage.verifyPrefilledFirstNameLastNameCompany(
                AddressIvanIvanov.firstName,
                AddressIvanIvanov.lastName,
                AddressIvanIvanov.companyName
            );
            await billingAndDeliveryPage.vatInput.fill(VatValid.id);

            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify VAT ID container is empty", async () => {
            await checkoutPage.verifyVatId(VatValid.id);
        });
    });

    test("product works properly", async ({ page, configurationPage, billingAndDeliveryPage, checkoutPage }) => {
        const cartPTE_edited = new CartSimulator(ClientConfigPTESingapore);

        /**
         * Given 4 clicks of product
         * Should decrement 1
         * Result: 3 Counts
         */
        const clickCountP1_decrement = 1;
        const clickCountP1_edited = 3;

        cartPTE_edited.add(testProductPTE1, clickCountP1_edited * testProductPTE1.packageSize!);

        const product1_edit_decrement = {
            marketPlaceCode: testProductPTE1.marketplaceCode!,
            clickCount: clickCountP1_decrement,
            countOfItems: cartPTE_edited.getItem(testProductPTE1.marketplaceCode!).qty.toString(),
            totalPrice: cartPTE_edited.asCurrencyString(
                cartPTE_edited.totalAmountByItemRaw(testProductPTE1.marketplaceCode!)
            ),
        };

        await test.step("checkout page, go to configuration page using edit button", async () => {
            await checkoutPage.editProductByMarketPlaceCode(page, product1_edit_decrement.marketPlaceCode);
        });

        await test.step("configuration page is open -> edit phone number", async () => {
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                product1.marketPlaceCode,
                product1.countOfItems
            );
            await configurationPage.subtractProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.clickCount
            );
            await configurationPage.verifyCountOfItemsByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.countOfItems
            );

            await configurationPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.totalPrice
            );

            await configurationPage.submitButton.click();
            await billingAndDeliveryPage.clickNextButton();
        });

        await test.step("checkout page, verify phone number was updated", async () => {
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product1_edit_decrement.marketPlaceCode,
                product1_edit_decrement.totalPrice
            );
            await checkoutPage.verifyTotalPriceOfProductByMarketPlaceCode(
                page,
                product2.marketPlaceCode,
                product2.totalPrice
            );
        });
    });
});
