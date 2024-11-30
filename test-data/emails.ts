import { Utils } from "../helper/utils";

export type Email = {
    email: string;
};

export const existingEMail: Email = {
    email: "existing@example.com",
};

export const getTestEmail = () => {
    if (["dev", "stage", "prod"].includes(process.env.test_env!)) return Utils.generateRandomEmail();
    return "not.existing@example.com";
};

switch (process.env.test_env) {
    case "dev":
        existingEMail.email = "test@example.com";
        break;
    case "stage":
        existingEMail.email = "test@example.com";
        break;
    case "prod":
        existingEMail.email = "daniel.balzter@aoe.com";
}
