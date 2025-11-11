import {DeadletterResponse} from "../../types/DeadletterResponse";


export const deadletterResponse : DeadletterResponse = {
    deadletterTransactions: [
      {
        transactionId: "b202ea99a53643c4bb1d73114a06ea21",
        insertionDate: "2025-07-02T17:22:29.689947547Z",
        paymentToken: "6535d0c28c67448f9936bad26aeb9743",
        paymentMethodName: "GOOGLEPAY",
        pspId: "CIPBITMM",
        eCommerceStatus: "REFUND_ERROR",
        gatewayAuthorizationStatus: "null",
        paymentEndToEndId: null,
        operationId: "321055056922651839",
        deadletterTransactionDetails: {
          queueName: "pagopa-u-weu-ecommerce-transactions-dead-letter-queue",
          data: "{\"event\":{\"_class\":\"it.pagopa.ecommerce.commons.documents.v2.TransactionRefundRetriedEvent\",\"id\":\"905cdbc7-9453-4e06-925b-2467993a2461\",\"transactionId\":\"b202ea99a53643c4bb1d73114a06ea21\",\"creationDate\":\"2025-07-02T16:52:27.305363346Z[Etc/UTC]\",\"data\":{\"retryCount\":3,\"transactionGatewayAuthorizationData\":null},\"eventCode\":\"TRANSACTION_REFUND_RETRIED_EVENT\"},\"tracingInfo\":{\"traceparent\":\"00-daae65aed7ca0fac9534bf0703f07cec-a53a60611d28fdc8-01\",\"tracestate\":null,\"baggage\":null}}",
          timestamp: "2025-07-02T17:22:29.689947547Z",
          transactionInfo: {
            transactionId: "b202ea99a53643c4bb1d73114a06ea21",
            authorizationRequestId: "E1751472447254teSA",
            "eCommerceStatus": "REFUND_ERROR",
            "paymentGateway": "NPG",
            "paymentTokens": ["6535d0c28c67448f9936bad26aeb9743"],
            "pspId": "CIPBITMM",
            "paymentMethodName": "GOOGLEPAY",
            "grandTotal": 12100,
            "rrn": null,
            "details": {
              "type": "NPG",
              "operationResult": "PENDING",
              "operationId": "321055056922651839",
              "correlationId": "292eeba9-1c39-4bb4-a6fe-2c2d351dfd14",
              "paymentEndToEndId": null,
              "outcome": null
            }
          }
        },
        eCommerceDetails: {
          "userInfo": {
            "userFiscalCode": null,
            "notificationEmail": "test@test.it",
            "surname": null,
            "name": null,
            "username": null,
            "authenticationType": "GUEST"
          },
          "transactionInfo": {
            "creationDate": "2025-07-02T16:07:24.467271641Z",
            "status": "Cancellato",
            "statusDetails": null,
            "eventStatus": "REFUND_ERROR",
            "amount": 12000,
            "fee": 100,
            "grandTotal": 12100,
            "rrn": null,
            "authorizationCode": null,
            "authorizationOperationId": null,
            "refundOperationId": null,
            "paymentMethodName": "GOOGLEPAY",
            "brand": "GOOGLEPAY",
            "authorizationRequestId": "E1751472447254teSA",
            "paymentGateway": "NPG",
            "correlationId": "292eeba9-1c39-4bb4-a6fe-2c2d351dfd14",
            "gatewayAuthorizationStatus": null,
            "gatewayErrorCode": null
          },
          "paymentInfo": {
            "origin": "CHECKOUT",
            "idTransaction": "b202ea99a53643c4bb1d73114a06ea21",
            "details": [
              {
                "subject": "TARI/TEFA 2021",
                "iuv": null,
                "rptId": "77777777777302018888888888887",
                "amount": 12000,
                "paymentToken": "6535d0c28c67448f9936bad26aeb9743",
                "creditorInstitution": "company PA",
                "paFiscalCode": "77777777777"
              }
            ]
          },
          "pspInfo": {
            "pspId": "CIPBITMM",
            "businessName": "NX PAYMENTS S.P.A.",
            "idChannel": "13212880150_17"
          },
          "product": "ECOMMERCE"
        },
        nodoDetails: {
          "dateFrom": "2025-07-02",
          "dateTo": "2025-07-02",
          "data": []
        },
        npgDetails: {
          "operations": [
            {
              "additionalData": {
                "authorizationCode": null,
                "rrn": null
              },
              "operationAmount": "12100",
              "operationCurrency": "EUR",
              "operationId": "321055056922651839",
              "operationResult": "CANCELED",
              "operationTime": "2025-07-02 18:07:27.611",
              "operationType": "AUTHORIZATION",
              "orderId": "E1751472447254teSA",
              "paymentCircuit": "GOOGLEPAY",
              "paymentEndToEndId": null,
              "paymentMethod": "APM"
            }
          ]
        }
      }
    ],
    "page": {
      "current": 0,
      "total": 3,
      "results": 10
    }
};

export const emptyDeadletterResponse : DeadletterResponse = {
  deadletterTransactions:[],
  page: {
      current: 0,
      total: 0,
      results: 0
  }
}