export class QueryRequest {
    currentContext = () => `query CurrentContext {
        Commerce_Checkout_CurrentContext {
          state {
            name
            ... on Commerce_Checkout_PlaceOrderState_State_Failed {
              name
              reason {
                reason
              }
            }
            ... on Commerce_Checkout_PlaceOrderState_State_Redirect {
              name
              URL
            }
          }
          orderInfos {
            email
            placedOrderInfos {
              orderNumber
            }
            paymentInfos{
              gateway
              paymentProvider
              method
              amount {
                amount
                currency
              }
            }
          }
          uuid
        }
      }`;

    getIPLocation = () => `query GetIPLocation { 
      Commerce_IPLocation {
          countryCode
          }
      }`;
    searchProduct = () => `query Search {
    Commerce_Product_Search(
        searchRequest: {}
    ) {
        products {
            marketPlaceCode
            attributes {
            getAttributesByKey(
            keys: [
            "minContractDuration"
            "gracePeriod"
            "maxOrderQuantity"
            "packageSize"
            "smsVolume"
            "dataVolume"
            "minContractDuration"
            "tariffName"
            "simType"
            ]
            ) {
            code
            unitCode
            value
            }
            }
            identifier
            title
            price {
                default {
                    amount
                    currency
                }
            }
        }
    }
}`;
    validateCart = () => `query validateCart {
    Commerce_Cart_Validator{
        hasCommonError
        commonErrorMessageKey
        itemResults{
            errorMessageKey
        }
    }
}`;

  billingCountries = () => `query billingCountries {
    ConnectShop_BillingCountries{
      code
      clientId
    }
  }`;

  shippingCountries = () => `query shippingCountries {
    ConnectShop_ShippingCountries{
      code
    }
  }`;

  contactLanguages = () => `query contactLanguages {
    ConnectShop_ContactLanguages{
      code
    }
  }`
}
