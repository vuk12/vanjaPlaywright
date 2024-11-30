import dotenv from "dotenv";

async function globalSetup() {
    const test_env = process.env.test_env ?? "local";
    dotenv.config({
        path: `helper/env/.env.${test_env}`,
        override: true,
    });
}
export default globalSetup;
