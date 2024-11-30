import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const shopConfig: PlaywrightTestConfig = {

    /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["line"],
    [
      "allure-playwright",
      {
        detail: true,
        outputFolder: "tests/allure-results",
        suiteTitle: true,
      },
    ],
  ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Take a screenshot by failure */
    screenshot: "only-on-failure",
    /* Record trace for each test, but remove all traces from successful test runs.. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Record video for each test, but remove all videos from successful test runs. */
    video: "on-first-retry",
    baseURL: process.env.BASE_URL,
    geolocation: { longitude: 42.359167, latitude: 42.359167 },
    permissions: ['geolocation'],
    locale: 'sr-ME',
    // Emulates the user timezone.
    timezoneId: 'Europe/Paris',

  },
  globalSetup: "helper/global-setup.ts",

    /* Maximum time one test can run for. */
    timeout: 60 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 7000,
    },

    projects: [
        {
            name: "chromium",
            testDir: "./tests-ui",
            use: {
                ...devices["Desktop Chrome"],
            },
        },
        {
            name: "firefox",
            testDir: "./tests-ui",
            use: {
                ...devices["Desktop Firefox"],
            },
        },
        {
            name: "webkit",
            testDir: "./tests-ui",
            use: {
                ...devices["Desktop Safari"],
            },
        },
        {
            name: "Mobile Chrome",
            testDir: "./tests-ui",
            use: {
                ...devices["iPhone 13 Pro"],
            },
        },
        {
            name: "Mobile Safari",
            testDir: "./tests-ui",
            use: {
                ...devices["iPhone 7"],
            },
        },
        {
            name: "shop graphql tests",
            testDir: "./tests-api/graphql-tests",
        },
    ],
};

export default shopConfig;
