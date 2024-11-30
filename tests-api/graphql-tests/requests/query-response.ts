/* eslint-disable no-prototype-builtins */
import { APIResponse, expect } from "@playwright/test";

export class QueryResponse {
    containsItemErrorMessage: (msg: string, r: APIResponse) => Promise<void> = async function (
        msg: string,
        r: APIResponse
    ) {
        const allMessages = [];
        const validationResults = await r.json();
        if (
            !validationResults.hasOwnProperty("data") ||
            !validationResults.data.hasOwnProperty("Commerce_Cart_Validator") ||
            !validationResults.data.Commerce_Cart_Validator.hasOwnProperty("itemResults")
        ) {
            throw new Error("no failed validations found in itemResults");
        }

        for (const i of validationResults.data.Commerce_Cart_Validator.itemResults) {
            allMessages.push(i.errorMessageKey);
        }
        expect(allMessages).toContain(msg);
    };
}
