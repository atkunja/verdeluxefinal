import { createTRPCRouter } from "~/server/trpc/main";
import { requestOffPlatformPayment } from "../procedures/payments/requestOffPlatformPayment";
import { getBillingConfig } from "../procedures/payments/getBillingConfig";
import { setBillingConfig } from "../procedures/payments/setBillingConfig";
import { createHold } from "../procedures/payments/createHold";
import { captureHold } from "../procedures/payments/captureHold";
import { cancelHold } from "../procedures/payments/cancelHold";
import { updateHold } from "../procedures/payments/updateHold";
import { listHolds } from "../procedures/payments/listHolds";
import { listCharges } from "../procedures/payments/listCharges";
import { getPaymentStatus } from "../procedures/payments/getPaymentStatus";
import { updateTransactionStatus } from "../procedures/payments/updateTransactionStatus";
import { updateTransactionCategory } from "../procedures/payments/updateTransactionCategory";
import { initiateAchPayout } from "../procedures/payments/initiateAchPayout";
import { getPendingCharges } from "../procedures/payments/getPendingCharges";

export const paymentsRouter = createTRPCRouter({
  requestOffPlatformPayment,
  getBillingConfig,
  setBillingConfig,
  createHold,
  captureHold,
  cancelHold,
  updateHold,
  listHolds,
  listCharges,
  getPaymentStatus,
  updateTransactionStatus,
  updateTransactionCategory,
  initiateAchPayout,
  getPendingCharges,
});
