export class MutationRequest {
    addProductToCart = (marketplaceCode: string, qty: number, deliveryCode: string) => `mutation {
        Commerce_Cart_AddToCart(
          addToCartInput: {marketplaceCode: "${marketplaceCode}", qty: ${qty}, deliveryCode: "${deliveryCode}"}
        ) {
          cart {
            grandTotal {
              amount
              currency
            }
            deliveries {
              cartitems {
                marketplaceCode
                productName
                qty
              }
            }
          }
        }
      }`;

    startVerification = (email: string) => `mutation StartVerification {
      ConnectShop_Verification_StartVerification(email: "${email}")
      } `;

    finishVerification = (
        firstName: string,
        lastName: string,
        token: string,
        preferredContactLanguage: string,
        company: string
    ) => `mutation FinishVerification {
      ConnectShop_Verification_FinishVerification(
          purchaserForm: {firstname: "${firstName}", lastname: "${lastName}", token: "${token}", preferredContactLanguage: "${preferredContactLanguage}", company: "${company}"}
        ) {
          processed
        }
      }
      `;

    setBillingAddress = (
        firstName: string,
        lastName: string,
        addressLine1: string,
        company: string,
        city: string,
        postCode: string,
        phoneNumber: string,
        contryCode: string,
        email: string,
        vat?: string
    ) => `mutation SetBillingAddress {
        Commerce_Cart_UpdateBillingAddress(
          addressForm: {vat: "${vat}", firstname: "${firstName}", lastname: "${lastName}", addressLine1: "${addressLine1}", company: "${company}", city: "${city}", postCode: "${postCode}", phoneNumber: "${phoneNumber}", countryCode: "${contryCode}", email: "${email}"}
        ) {
          formData {
            vat
            firstname
            lastname
            addressLine1
            company
            city
            postCode
            countryCode
            phoneNumber
            email
          }
          processed
          validationInfo {
            fieldErrors {
              messageKey
              defaultLabel
              fieldName
            }
            generalErrors {
              messageKey
              defaultLabel
            }
          }
        }
      }`;

    setDeliveryAddressAsBillingAddress = (deliveryCode: string, useBillingAddress: boolean) => `
      mutation SetDeliveryAddress {
        Commerce_Cart_UpdateDeliveryAddresses(
          deliveryAdresses: {deliveryCode: "${deliveryCode}", useBillingAddress: ${useBillingAddress}}
        ) {
          deliveryCode
          processed
          validationInfo {
            fieldErrors {
              messageKey
              defaultLabel
              fieldName
            }
            generalErrors {
              messageKey
              defaultLabel
            }
          }
        }
      }`;

    addPayment = (gateway: string, method: string) => `mutation AddPayment {
        Commerce_Cart_UpdateSelectedPayment(gateway: "${gateway}", method: "${method}") {
          processed
        }
      }`;

    placeOrder = (returnUrl: string) => `mutation PlaceOrder {
        Commerce_Checkout_StartPlaceOrder(
          returnUrl: "${returnUrl}"
        ) {
          uuid
        }
      }`;

    updateAdditionalData = (key: string, value: string) => `mutation updateAdditionalData {
      Commerce_Cart_UpdateAdditionalData(additionalData: {key: "${key}", value: "${value}"}){
        __typename
      }
    }`;
}
