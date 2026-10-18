import { TransactionCheck } from "@/app/types/TransactionCheck";
import { deadletterResponse } from "@/app/__tests__/mock/DataMocks";

const source = deadletterResponse.deadletterTransactions[0];

export const transactionCheckMock: TransactionCheck = {
  transactionId: source.transactionId,
  eCommerceStatus: "NOTIFIED_OK",
  nodoStatus: "NOTIFIED",
  gatewayStatus: null,
  events: [
    { eventCode: "TRANSACTION_AUTHORIZATION_REQUESTED_EVENT", creationDate: "2025-07-02T16:07:54Z" },
    { eventCode: "TRANSACTION_ACTIVATED_EVENT", creationDate: "2025-07-02T16:07:24.467Z[Etc/UTC]" },
  ],
  eCommerceDetails: source.eCommerceDetails,
  npgDetails: source.npgDetails,
  nodoDetails: source.nodoDetails,
};
