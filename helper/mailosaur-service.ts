import { expect } from "@playwright/test";
import Mailosaur from "mailosaur";
import { TEST_DATA } from "../test-data/test-data";
import { EnvHelper } from "./env-helper";
import { MailosaurSettings } from "./mailosaur-settings";

export class MailosaurService {
  _mailosaurInstance: Mailosaur;

  constructor() {
    this._mailosaurInstance = new Mailosaur(MailosaurSettings.API_KEY);
  }

  async getConfirmationCode(testEmail: string) {
    if (EnvHelper.isLocal()) return TEST_DATA.CONFIRMATION_CODE;

    const email = await this._mailosaurInstance.messages.get(MailosaurSettings.SERVER_ID, {
      sentTo: testEmail,
    });
    const confirmationCode = email.html?.codes![0].value;
    return confirmationCode;
  }

  async verifyEmailContainsValue(testEmail: string, value: string) {
    const email = await this._mailosaurInstance.messages.get(MailosaurSettings.SERVER_ID, { sentTo: testEmail });
    expect(email.html?.body).toContain(value);
  }

  async verifyEmailsSenderName(testEmail: string, senderName: string) {
    const email = await this._mailosaurInstance.messages.get(MailosaurSettings.SERVER_ID, { sentTo: testEmail });
    expect(email.from[0].name).toContain(senderName);
  }

  async verifyEmailsSubject(testEmail: string, subject: string) {
    const email = await this._mailosaurInstance.messages.get(MailosaurSettings.SERVER_ID, { sentTo: testEmail });
    expect(email.subject).toContain(subject);
  }

  async deleteEmail(testEmail: string) {
    const email = await this._mailosaurInstance.messages.get(MailosaurSettings.SERVER_ID, { sentTo: testEmail });
    await this._mailosaurInstance.messages.del(email.id!);
  }
}
