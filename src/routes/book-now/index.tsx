import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/book-now/")({
  component: BookNowPage,
});

function BookNowPage() {
  return <Navigate to="/booking-quiz" />;
}
