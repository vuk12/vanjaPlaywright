export type Tax = {
    id: string;
};

export const VatValid: Tax = {
    id: "DE200149474",
};
export const VatInvalid: Tax = {
    id: "DE400475692",
};
export const VatTechnicalError: Tax = {
    id: "DE400475692",
};
export const VatMaxLengthError: Tax = {
    id: "DE4004756924004756921",
};

if (["dev", "stage", "prod"].includes(process.env.test_env!)) {
    VatValid.id = "DE315149474";
    VatInvalid.id = "DE186775212";
}
