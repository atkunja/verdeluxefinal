import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/booking-quiz/")({
  component: BookingQuizIndex,
});

function BookingQuizIndex() {
  return <Navigate to="/booking-quiz/start" />;
}
