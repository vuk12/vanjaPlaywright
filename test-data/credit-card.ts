export type CreditCard = {
    number: string
    expireDate: string
    cvc: string
    holder: string
}

export const CreditCardSuccess: CreditCard = {
    number: "4242 4242 4242 4242",
    expireDate: "01/35",
    cvc: "123",
    holder: "Maximilian Mustermann"
}