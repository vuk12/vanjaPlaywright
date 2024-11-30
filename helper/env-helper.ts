export class EnvHelper {
  static isStaging() {
    return ["e2e", "stage"].includes(process.env.test_env);
  }

  static isLocal() {
    return !["dev", "e2e", "stage", "prod"].includes(process.env.test_env!);
  }
}
