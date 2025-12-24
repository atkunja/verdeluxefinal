export const bookingAnalytics = {
  stepViewed(step: string) {
    console.info("analytics: booking_step_viewed", step);
  },
  selectionMade(type: string, value: unknown) {
    console.info("analytics: booking_selection_made", { type, value });
  },
  submitted(payload: unknown) {
    console.info("analytics: booking_submitted", payload);
  },
};
