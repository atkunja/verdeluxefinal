import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getPublicConfig = baseProcedure.query(() => {
    return {
        googlePlacesKey: env.VITE_GOOGLE_PLACES_KEY || env.VITE_GOOGLE_MAPS_API_KEY || null,
        stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY || null,
    };
});
