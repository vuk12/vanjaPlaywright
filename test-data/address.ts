export type Address = {
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  address: string;
  city: string;
  postCode: string;
  country: string;
};

export type BrazilAddress = {
  baseAddress: Address;
  state: string;
  neighbourhood: string;
};

export const AddressMaxMustermann: Address = {
  firstName: "Maximilian",
  lastName: "Mustermann",
  companyName: "Mustermann GmbH",
  phoneNumber: "+49 178 0000000",
  address: "Schwalbacher Str 19",
  city: "Wiesbaden",
  postCode: "65185",
  country: "DE",
};

export const AddressErikaMusterfrau: Address = {
  firstName: "Erika",
  lastName: "Musterfrau",
  companyName: "Musterfrau AG",
  phoneNumber: "+44 7975 111111",
  address: "48 The Avenue",
  city: "London",
  postCode: "NW6 7NP",
  country: "GB",
};

export const AddressIvanIvanov: Address = {
  firstName: "Ivan",
  lastName: "Ivanov",
  companyName: "Ivanov AG",
  phoneNumber: "+65 6123 4567",
  address: "874D Tampines St. 85",
  city: "Singapore",
  postCode: "523872",
  country: "SG",
};

export const BrazilAddressMiguelBrazilanos: BrazilAddress = {
  baseAddress:{
  firstName: "Miguel",
  lastName: "Brazilanos",
  companyName: "BrazilCompany AG",
  phoneNumber: "+55 12 3532 5934",
  address: "Av. Paulista 1024",
  city: "Mock200", // São Paulo
  postCode: "523872",
  country: "BR",
},
  neighbourhood: "Bela Vista",
  state: "SP",
};

export const BrazilAddressManuelPortuguesos: BrazilAddress = {
  baseAddress:{
  firstName: "Manuel",
  lastName: "Portuguesos",
  companyName: "PortugueseCompany AG",
  phoneNumber: "+351 21 343 2148",
  address: "Av. da Liberdade 245",
  city: "Lisboa", //
  postCode: "1250-142",
  country: "PT",
},
  neighbourhood: "Bela Vista",
  state: "SP",
};

if (process.env.test_env == "test") {
  AddressMaxMustermann.firstName = "Mock200";
  AddressMaxMustermann.city = "Mock200";
}
