# 1NCE Connect Shop & Portal tests

This repository contains the tests for 1NCE Connect Shop & Portal.

## Installation guide

-   Clone the repository.
-   Make sure to have Node.js installed on your machine.
    -   Run `node -v` on your command line to check if Node.js is installed. Make sure to have node version 16 or newer.
    -   If it's missing install Node.js, e.g. with brew via `brew install node`.
-   Run from tests folder `npx playwright install` to install playwright.
-   Run from tests folder `npm i -D @playwright/test` to install playwright's test library.

## Execute tests on local machine

-   To execute all tests run `npx playwright test`. The tests will be executed on the development environment by default.
-   To execute all tests on the particular environment run `test_env=${environment} npx playwright test` and replace "environment" with particular environment name, e.g. `test_env=dev npx playwright test`
-   To execute a specific spec run `npx playwright test example.spec.ts` and replace _example.spec.ts_ by the actual filename.
-   By default tests will run headless. Append the headed parameter to actually see tests running in the browser, e.g. `npx playwright test --headed`

## Execute tests in ci/cd pipeline

-   The test artifacts like screenshot, video and trace could be founded in the test job -> Job artifacts -> Browse -> services -> e2e -> test-results -> failed test name
-   The trace.zip file can be open on https://trace.playwright.dev/
