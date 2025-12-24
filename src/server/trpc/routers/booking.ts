import { createTRPCRouter } from "~/server/trpc/main";
import { calculateQuizPrice } from "../procedures/booking/calculateQuizPrice";
import { createBookingFromQuiz } from "../procedures/booking/createBookingFromQuiz";
import { getPublicPricingRules } from "../procedures/booking/getPublicPricingRules";
import { getDiscountConfig } from "../procedures/booking/getDiscountConfig";
import { upsertDiscountConfig } from "../procedures/booking/upsertDiscountConfig";
import { sendQuizOtp } from "../procedures/booking/sendQuizOtp";
import { verifyQuizOtp } from "../procedures/booking/verifyQuizOtp";
import { resendQuizOtp } from "../procedures/booking/resendQuizOtp";
import { startQuizSubmission } from "../procedures/booking/startQuizSubmission";
import { updateQuizSubmission } from "../procedures/booking/updateQuizSubmission";
import { createQuizSetupIntent } from "../procedures/booking/createQuizSetupIntent";
import { attachQuizPaymentMethod } from "../procedures/booking/attachQuizPaymentMethod";
import { confirmQuizPayment } from "../procedures/booking/confirmQuizPayment";
import { getQuizAvailability } from "../procedures/booking/getQuizAvailability";

export const bookingRouter = createTRPCRouter({
  calculateQuizPrice,
  createBookingFromQuiz,
  getPublicPricingRules,
  getDiscountConfig,
  upsertDiscountConfig,
  sendQuizOtp,
  verifyQuizOtp,
  resendQuizOtp,
  startQuizSubmission,
  updateQuizSubmission,
  createQuizSetupIntent,
  attachQuizPaymentMethod,
  confirmQuizPayment,
  getQuizAvailability,
});
