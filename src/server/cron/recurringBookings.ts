import { db } from "~/server/db";

export async function createBookingsFromTemplates() {
  const templates = await db.recurringBookingTemplate.findMany();

  for (const template of templates) {
    // This is a placeholder. A real implementation would need to check
    // if a booking for the current period already exists and handle
    // timezones correctly.
    const bookingDate = new Date();

    if (
      (!template.endDate || bookingDate < template.endDate) &&
      bookingDate > template.startDate &&
      bookingDate.getDay() === template.dayOfWeek
    ) {
      await db.booking.create({
        data: {
          clientId: template.clientId,
          serviceType: template.serviceType,
          address: template.address,
          specialInstructions: template.specialInstructions,
          serviceFrequency: template.serviceFrequency,
          scheduledDate: bookingDate,
          scheduledTime: template.bookingTime,
        },
      });
    }
  }
}
