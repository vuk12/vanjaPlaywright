import { MailosaurSettings } from "./mailosaur-settings";

export class Utils {
  // Generate random string with given length; default length is 8
  static generateRandomString(length = 30) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789!#$%&'*+-/=?^_`{|}~";

    // Pick characters randomly
    let randomString = "";
    for (let i = 0; i < length; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return randomString;
  }

  static generateRandomEmail() {
    const randomString = this.generateRandomString();
    const randomEmail = randomString + MailosaurSettings.DOMAIN;
    return randomEmail;
  }

  // Generate random number with a given length;
  static generateRandomNumber(length = 5) {
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
  }

  static getCurrentYear() {
    return new Date().getFullYear();
  }
}
