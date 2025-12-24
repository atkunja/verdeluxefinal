import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BookingWizardProvider } from "~/components/bookings/wizard/BookingWizardProvider";

export const Route = createFileRoute("/booking-quiz")({
  component: BookingQuizLayout,
});

function BookingQuizLayout() {
  return (
    <BookingWizardProvider>
      <Outlet />
    </BookingWizardProvider>
  );
}
