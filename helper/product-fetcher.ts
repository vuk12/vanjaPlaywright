import { APIRequestContext } from "@playwright/test";
import { ClientConfig } from "./cart-simulator";

export type Product = {
    maxQty?: number;
    marketplaceCode?: string;
    price?: Price;
    packageSize?: number;
    title?: string;
};

type Price = {
    amount: number;
    currency: string;
};

type ResponseProduct = {
    title: string;
    attributes: ResponseAttributes;
    marketPlaceCode: string;
    price: ResponseDefaultPrice;
};

type ResponseAttributes = {
    getAttributesByKey: [];
};

type ResponseDefaultPrice = {
    default: ResponsePrice;
};
type ResponsePrice = {
    amount: number;
    currency: string;
};

export const GQLUriBuilder = (c: ClientConfig): string => {
    const base = process.env.BASE_URL_BFF;
    if (base === undefined) {
        throw new Error("env: BASE_URL_BFF is undefined");
    }

    return base + "/" + c.prefix + "/graphql";
};

export class ProductFetcher {
    graphQLURL: string;
    products: Product[];
    currency: string;

    constructor(r: APIRequestContext, c: ClientConfig) {
        this.request = r;
        this.graphQLURL = process.env.BASE_URL_BFF + "/" + c.prefix + "/graphql";
        this.products = [];
        this.currency = c.currency;
    }

    request: APIRequestContext;

    async getProduct(): Promise<Product> {
        if (this.products.length == 0) {
            this.products = await this.fetch();
        }

        return this.products.shift()!;
    }

    async getProductWithTestablePackageSize(): Promise<Product> {
        if (this.products.length == 0) {
            this.products = await this.fetch();
        }

        for (const product of this.products) {
            if (product.packageSize! > 1) {
                this.products.forEach((item, index) => {
                    if (item.marketplaceCode === product.marketplaceCode) this.products.splice(index, 1);
                });
                return product;
            }
        }

        return this.products.shift()!;
    }

    async fetch(): Promise<Product[]> {
        const products = [];
        const response = await this.request.post(this.graphQLURL, {
            data: {
                query: `query Search {
                            Commerce_Product_Search(
                                searchRequest: {}
                            ) {
                                products {
                                    marketPlaceCode
                                    attributes {
                                    getAttributesByKey(
                                    keys: [
                                    "minContractDuration"
                                    "gracePeriod"
                                    "maxOrderQuantity"
                                    "packageSize"
                                    "smsVolume"
                                    "dataVolume"
                                    "minContractDuration"
                                    "tariffName"
                                    "simType"
                                    ]
                                    ) {
                                    code
                                    unitCode
                                    value
                                    }
                                    }
                                    identifier
                                    title
                                    price {
                                        default {
                                            amount
                                            currency
                                        }
                                    }
                                }
                            }
                        }`,
            },
        });

        const productData = await response.json();
        for (const d of productData.data.Commerce_Product_Search.products) {
            products.push(this.createProduct(d));
        }

        return products;
    }

    createProduct(data: ResponseProduct): Product {
        const p: Product = {};

        data.attributes.getAttributesByKey.forEach(function (attr: { code: string; value: string | number }) {
            if (attr.code == "maxOrderQuantity") {
                p.maxQty = +attr.value;
            }
            if (attr.code == "packageSize") {
                p.packageSize = +attr.value;
            }
        });

        p.title = data.title;
        p.marketplaceCode = data.marketPlaceCode;
        p.price = {
            amount: data.price.default.amount,
            currency: data.price.default.currency,
        };

        return p;
    }
}
