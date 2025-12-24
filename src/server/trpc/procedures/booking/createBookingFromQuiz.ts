import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const createBookingFromQuiz = baseProcedure
  .input(
    z.object({
      draft: z.any(), // We'll validate inside or use the imported schema if possible, but for now 'any' to avoid circular dep issues on server
    })
  )
  .mutation(async ({ input }) => {
    const draft = input.draft;

    if (!draft || !draft.contact || !draft.contact.email) {
      throw new Error("Missing contact information (email) in booking draft.");
    }

    // 1. Find or Create User
    let user = await db.user.findUnique({ where: { email: draft.contact.email } });
    if (!user) {
      // Create a user with a placeholder password (they can set it later or via magic link)
      // In a real app, you'd trigger a "Finish Account Setup" email here.
      user = await db.user.create({
        data: {
          email: draft.contact.email,
          firstName: draft.contact.fullName?.split(" ")[0] || "Client",
          lastName: draft.contact.fullName?.split(" ").slice(1).join(" ") || "",
          phone: draft.contact.phone,
          role: "CLIENT",
          password: "", // Managed by Supabase or placeholder
        }
      });
    } else {
      // Update phone if missing
      if (!user.phone && draft.contact.phone) {
        await db.user.update({
          where: { id: user.id },
          data: { phone: draft.contact.phone }
        });
      }
    }

    // 2. Create Booking
    // Build address with fallbacks for undefined components
    const addressParts = [
      draft.address?.street || draft.address?.formatted?.split(",")[0] || "",
      draft.address?.city || "",
      draft.address?.state || "",
      draft.address?.zip || ""
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : draft.address?.formatted || "Address not provided";

    const booking = await db.booking.create({
      data: {
        clientId: user.id,
        serviceType: draft.cleanType?.toUpperCase() || "STANDARD",
        scheduledDate: new Date(draft.schedule?.dateISO || new Date()),
        scheduledTime: draft.schedule?.timeSlotStartISO || "09:00",
        address: fullAddress,
        numberOfBedrooms: draft.beds || 1,
        numberOfBathrooms: draft.baths || 1,
        finalPrice: draft.pricing?.total || 0,
        status: "PENDING",
        numberOfCleanersRequested: 1,
        specialInstructions: draft.logistics?.cleaningInstructions || null,
        // Additional address fields
        addressLine1: draft.address?.street,
        city: draft.address?.city,
        state: draft.address?.state,
        postalCode: draft.address?.zip,
        placeId: draft.address?.placeId,
        latitude: draft.address?.lat,
        longitude: draft.address?.lng,
      }
    });

    // 3. Create Quiz Submission Record (for Admin "Signups" view)
    // We check if one exists for this email/session? For now, just create a new completed one.
    await db.cleanQuizSubmission.create({
      data: {
        fullName: draft.contact.fullName,
        email: draft.contact.email,
        phone: draft.contact.phone,
        cleanType: draft.cleanType,
        bedrooms: draft.beds,
        bathrooms: draft.baths,
        addressLine1: draft.address?.street,
        city: draft.address?.city,
        state: draft.address?.state,
        postalCode: draft.address?.zip,
        finalTotalCents: Math.round((draft.pricing?.total || 0) * 100),
        status: "confirmed", // Mark as confirmed since they placed the booking
      }
    });

    return { success: true, bookingId: booking.id, userId: user.id };
  });
