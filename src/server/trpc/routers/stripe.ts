import { createTRPCRouter } from "~/server/trpc/main";
import { createPaymentIntent } from "../procedures/stripe/createPaymentIntent";
import { capturePayment } from "../procedures/stripe/capturePayment";
import { refundPayment } from "../procedures/stripe/refundPayment";
import { getBookingPayments } from "../procedures/stripe/getBookingPayments";
import { createSetupIntent } from "../procedures/stripe/createSetupIntent";
import { attachPaymentMethodFromSetupIntent } from "../procedures/stripe/attachPaymentMethodFromSetupIntent";
import { createChargeWithSavedMethod } from "../procedures/stripe/createChargeWithSavedMethod";

export const stripeRouter = createTRPCRouter({
  createPaymentIntent,
  capturePayment,
  refundPayment,
  getBookingPayments,
  createSetupIntent,
  attachPaymentMethodFromSetupIntent,
  createChargeWithSavedMethod,
});
