import { Utils } from "../helper/utils";

export type ClientTitles = {
  name: string;
  footer: string;
  stripeTitle: string;
  emailFooter: string;
};

export const ClientTitlesGMBH: ClientTitles = {
  name: "GMBH",
  footer: `© ${Utils.getCurrentYear()} 1NCE GmbH`,
  stripeTitle: "1NCE GmbH",
  emailFooter: `© ${Utils.getCurrentYear()} 1NCE GmbH`,
};

export const ClientTitlesPTE: ClientTitles = {
  name: "PTE",
  footer: `© ${Utils.getCurrentYear()} 1NCE PTE. LTD`,
  stripeTitle: "1NCE PTE. LTD.",
  emailFooter: "1NCE Pte. Ltd. (UEN: 202220778K)",
};

export const ClientTitlesBrazil: ClientTitles = {
  name: "Brazil",
  footer: `© ${Utils.getCurrentYear()} 1NCE Telecomunicações LTDA`,
  stripeTitle: "",
  emailFooter: ``,
};
