import {
  createCallerFactory,
  createTRPCRouter,
  baseProcedure,
} from "~/server/trpc/main";
import { bookingRouter } from "./routers/booking";
import { login } from "./procedures/auth/login";
import { getCurrentUser } from "./procedures/auth/getCurrentUser";
import { forgotPassword } from "./procedures/auth/forgotPassword";
import { getSchedule } from "./procedures/cleaner/getSchedule";
import { getPayments } from "./procedures/cleaner/getPayments";
import { getUpcomingBookings } from "./procedures/client/getUpcomingBookings";
import { getAllBookings } from "./procedures/client/getAllBookings";
import { cancelBookingClient } from "./procedures/client/cancelBookingClient";
import { getAllBookingsAdmin } from "./procedures/admin/getAllBookingsAdmin";
import { getAllUsersAdmin } from "./procedures/admin/getAllUsersAdmin";
import { getCustomerDetailsAdmin } from "./procedures/admin/getCustomerDetailsAdmin";
import { getCustomerPaymentMethods } from "./procedures/admin/getCustomerPaymentMethods";
import { getSession } from "./procedures/auth/getSession";
import { createBookingAdmin } from "./procedures/admin/createBookingAdmin";
import { updateBookingAdmin } from "./procedures/admin/updateBookingAdmin";
import { deleteBookingAdmin } from "./procedures/admin/deleteBookingAdmin";
import { getBookingStatsAdmin } from "./procedures/admin/getBookingStatsAdmin";
import { getRevenueReport } from "./procedures/admin/getRevenueReport";
import { getQuizSubmissions } from "./procedures/admin/getQuizSubmissions";
import { getBookingAdmin } from "./procedures/admin/getBookingAdmin";
import { getBookingTimeLogs } from "./procedures/admin/getBookingTimeLogs";
import { addBookingTip } from "./procedures/admin/addBookingTip";
import { getPayoutSummary } from "./procedures/admin/getPayoutSummary";
import { recordCleanerPayment } from "./procedures/admin/recordCleanerPayment";
import { sendAddCardLink } from "./procedures/admin/sendAddCardLink";
import { createUserAdmin } from "./procedures/admin/createUserAdmin";
import { updateUserAdmin } from "./procedures/admin/updateUserAdmin";
import { deleteUserAdmin } from "./procedures/admin/deleteUserAdmin";
import { createChecklistTemplate } from "./procedures/admin/createChecklistTemplate";
import { getChecklistTemplates } from "./procedures/admin/getChecklistTemplates";
import { updateChecklistTemplate } from "./procedures/admin/updateChecklistTemplate";
import { deleteChecklistTemplate } from "./procedures/admin/deleteChecklistTemplate";
import { getBookingChecklist } from "./procedures/admin/getBookingChecklist";
import { updateBookingChecklistItem } from "./procedures/admin/updateBookingChecklistItem";
import { getPricingRules } from "./procedures/admin/getPricingRules";
import { createPricingRule } from "./procedures/admin/createPricingRule";
import { updatePricingRule } from "./procedures/admin/updatePricingRule";
import { deletePricingRule } from "./procedures/admin/deletePricingRule";
import { calculateBookingPrice } from "./procedures/admin/calculateBookingPrice";
import { getBookingAvailability } from "./procedures/admin/getBookingAvailability";
import { getCleanerAvailabilityDetails } from "./procedures/admin/getCleanerAvailabilityDetails";
import { generateToken } from "./procedures/dialer/generateToken";
// makeCall removed - OpenPhone API does not support programmatic call initiation
import { getCallHistory } from "./procedures/dialer/getCallHistory";
import { submitTimeOffRequest } from "./procedures/cleaner/submitTimeOffRequest";
import { getTimeOffRequests } from "./procedures/cleaner/getTimeOffRequests";
import { deleteTimeOffRequest } from "./procedures/cleaner/deleteTimeOffRequest";
import { updateTimeOffRequest } from "./procedures/cleaner/updateTimeOffRequest";
import { getAllTimeOffRequests } from "./procedures/admin/getAllTimeOffRequests";
import { updateTimeOffRequestStatus } from "./procedures/admin/updateTimeOffRequestStatus";
import { clearTimeOffRequestAdmin } from "./procedures/admin/clearTimeOffRequestAdmin";
import { timeRouter } from "./routers/time";
import { messagingRouter } from "./routers/messaging";
import { systemRouter } from "./routers/system";
import { availabilityRouter } from "./routers/availability";
import { photosRouter } from "./routers/photos";
import { bulkRouter } from "./routers/bulk";
import { emailRouter } from "./routers/email";
import { paymentsRouter } from "./routers/payments";
import { smsRouter } from "./routers/sms";
import { documentsRouter } from "./routers/documents";
import { stripeRouter } from "./routers/stripe";
import { mercuryRouter } from "./routers/mercury";
import { accountingRouter } from "./routers/accounting";
import { crmRouter } from "./routers/crm";
import { aiRouter } from "./routers/ai";
import { marketingRouter } from "./routers/marketing";
import { socialRouter } from "./routers/social";
import { seoRouter } from "./routers/seo";
import { trainingRouter } from "./routers/training";
import { faqRouter } from "./routers/faq";
import { reviewsRouter } from "./routers/reviews";
import { tasksRouter } from "./routers/tasks";
import { generateRecurrences } from "./procedures/admin/generateRecurrences";
import { sendTransactionalEmail } from "./procedures/email/sendTransactionalEmail";
import { seedDefaultEmailTemplates } from "./procedures/admin/seedDefaultEmailTemplates";
import { sendBookingReceipt } from "./procedures/admin/sendBookingReceipt";
import { sendBookingInvoice } from "./procedures/admin/sendBookingInvoice";
import { getAvailabilityConflicts } from "./procedures/admin/getAvailabilityConflicts";
import { getLatestBookingForClient } from "./procedures/admin/getLatestBookingForClient";
import { getAdminTasks } from "./procedures/admin/getAdminTasks";
import { updateProfile } from "./procedures/admin/updateProfile";
import { getActiveTimeEntries } from "./procedures/admin/getActiveTimeEntries";
import { assignCleaners } from "./procedures/admin/assignCleaners";
import { globalSearch } from "./procedures/admin/globalSearch";


import { register } from "./procedures/auth/register";

export const appRouter = createTRPCRouter({
  booking: bookingRouter,
  globalSearch,
  // Auth procedures
  register,
  login,
  getCurrentUser,
  forgotPassword,
  // Cleaner procedures
  getSchedule,
  getPayments,
  submitTimeOffRequest,
  getTimeOffRequests,
  deleteTimeOffRequest,
  updateTimeOffRequest,
  // Client procedures
  getUpcomingBookings,
  getAllBookings,
  cancelBookingClient,
  // Admin procedures
  getAllBookingsAdmin,
  getAllUsersAdmin,
  getCustomerDetailsAdmin,
  getCustomerPaymentMethods,
  getSession,
  createBookingAdmin,
  updateBookingAdmin,
  deleteBookingAdmin,
  getBookingStatsAdmin,
  getRevenueReport,
  getQuizSubmissions,
  getBookingAdmin,
  sendAddCardLink,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getAllTimeOffRequests,
  updateTimeOffRequestStatus,
  clearTimeOffRequestAdmin,
  generateRecurrences,
  sendTransactionalEmail,
  seedDefaultEmailTemplates,
  sendBookingReceipt,
  sendBookingInvoice,
  getAvailabilityConflicts,
  getLatestBookingForClient,
  getAdminTasks,
  updateProfile,
  getActiveTimeEntries,
  getBookingTimeLogs,
  addBookingTip,
  getPayoutSummary,
  recordCleanerPayment,
  assignCleaners,

  // Checklist procedures
  createChecklistTemplate,
  getChecklistTemplates,
  updateChecklistTemplate,
  deleteChecklistTemplate,
  getBookingChecklist,
  updateBookingChecklistItem,
  // Pricing procedures
  getPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculateBookingPrice,
  // Availability procedures
  getBookingAvailability,
  getCleanerAvailabilityDetails,
  // Dialer procedures
  generateToken,
  // makeCall, // Removed - not supported by OpenPhone API
  getCallHistory,
  time: timeRouter,
  messaging: messagingRouter,
  system: systemRouter,
  availability: availabilityRouter,
  photos: photosRouter,
  bulk: bulkRouter,
  email: emailRouter,
  payments: paymentsRouter,
  sms: smsRouter,
  documents: documentsRouter,
  stripe: stripeRouter,
  mercury: mercuryRouter,
  accounting: accountingRouter,
  crm: crmRouter,
  ai: aiRouter,
  marketing: marketingRouter,
  social: socialRouter,
  seo: seoRouter,
  training: trainingRouter,
  faq: faqRouter,
  reviews: reviewsRouter,
  tasks: tasksRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
