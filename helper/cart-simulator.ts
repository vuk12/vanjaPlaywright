import { Product } from "./product-fetcher";

type CartItem = {
    qty: number;
    product: Product;
};

export type ClientConfig = {
    prefix: string;
    currency: string;
    locale: string; // @todo maybe remove this from clientConfig (since it is more a variation)
    tax: number;
    currencyDisplay: string;
};

export const ClientConfigPTESingapore: ClientConfig = {
    prefix: "pte",
    currency: "USD",
    locale: "en-eu",
    tax: 9,
    currencyDisplay: "code",
};

export const ClientConfigPTEDefault: ClientConfig = {
    prefix: "pte",
    currency: "USD",
    locale: "en-eu",
    tax: 0,
    currencyDisplay: "code",
};

export const ClientConfigGMBHDefault: ClientConfig = {
    prefix: "gmbh",
    currency: "EUR",
    locale: "de-de",
    tax: 19,
    currencyDisplay: "symbol",
};

export const ClientConfigBrazilDefault: ClientConfig = {
    prefix: "brazil",
    currency: "BRL",
    locale: "en-br",
    tax: 0,
    currencyDisplay: "code",
};

export const ClientConfigGMBHEnglish: ClientConfig = {
    prefix: "gmbh",
    currency: "EUR",
    locale: "en-eu",
    tax: 19,
    currencyDisplay: "symbol",
};

/**
 * The idea of the simulator is to add the same products as we would add to the "real" cart and compare the outcomes
 * like prices and so on with the internal calculations.
 *
 * This is necessary because we can not rely on getting always the same product data from our external sources.
 */
export class CartSimulator {
    public shippingCosts: number;
    private readonly locale: string;
    private items: CartItem[] = [];
    private readonly currency: string;
    private readonly tax: number;
    private readonly currencyDisplay: string;

    constructor(c: ClientConfig) {
        this.locale = c.locale;
        this.shippingCosts = 6.99;

        if(c.currency.includes("BRL"))
        {
            this.shippingCosts=0;
        }

        this.currency = c.currency;
        this.tax = c.tax;
        this.currencyDisplay = c.currencyDisplay;
    }

    /**
     * Find item by marketplaceCode in the local cart.
     * @param marketplaceCode market place code of the product
     */
    getItem(marketplaceCode: string): CartItem {
        for (const i of this.items) {
            if (i.product.marketplaceCode == marketplaceCode) {
                return i;
            }
        }
    }

    getItems(): Array<CartItem> {
        return this.items;
    }

    /**
     * Calculates the needed quantity for a product to reach more than a total amount of x.
     *
     * @param product
     * @param amount
     */
    qtyForAmountBiggerThan(product: Product, amount: number): number {
        const pricePerPackage = product.packageSize! * product.price!.amount;
        const qty = (Math.ceil(amount / pricePerPackage) + 1) * product.packageSize!;

        return qty;
    }

    /**
     * Add a product to the cart
     *
     * @param product
     * @param qty
     */
    add(product: Product, qty: number): void {
        const x: CartItem = { product: product, qty: qty };
        this.items.push(x);
    }

    /**
     * Sums up the total amount of all products in the cartSimulator.
     */
    totalAmountRaw(): number {
        let total: number = 0;
        for (const i of this.items) {
            total = total + i.qty * i.product.price!.amount;
        }

        return total;
    }

    totalAmountRawWithShipping(): number {
        let total: number = this.totalAmountRaw();
        total += this.shippingCosts;

        return total;
    }

    /**
     * Calculate the tax amount
     */
    taxes(): number {
        return (this.totalAmountRawWithShipping() / 100) * this.tax;
    }

    /**
     * Sums up the total amount of one specific item in the cart.
     * @param m
     */
    totalAmountByItemRaw(m: string): number {
        const total: number = 0;
        for (const i of this.items) {
            if (m == i.product.marketplaceCode) return i.qty * i.product.price!.amount;
        }

        return total;
    }

    /**
     * Calculate all items and add taxes
     */
    grandTotalWithTax(): number {
        const taxValue = 100 + this.tax;
        return Math.round(((this.totalAmountRawWithShipping() * 100) / 100) * taxValue) / 100;
    }

    /**
     * Prints a given number m as a locale related currency
     * @param m
     */
    asCurrencyString(m: number): string {
        return m.toLocaleString(this.locale, {
            style: "currency",
            currency: this.currency,
            currencyDisplay: this.currencyDisplay,
        });
    }
}
