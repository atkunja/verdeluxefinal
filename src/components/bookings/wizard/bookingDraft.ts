import { z } from "zod";

export const bookingDraftSchema = z.object({
  address: z.object({
    formatted: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    placeId: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  cleanType: z.enum(["tidy", "basic", "deep", "moving"]).optional(),
  beds: z.number().min(0),
  baths: z.number().min(1),
  cleanliness: z.number().min(1).max(5),
  kids: z.boolean(),
  pets: z.boolean(),
  extras: z.array(z.string()),
  schedule: z.object({
    dateISO: z.string().optional(),
    timeSlotStartISO: z.string().optional(),
    timeSlotEndISO: z.string().optional(),
    label: z.string().optional(),
  }),
  contact: z.object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  logistics: z.object({
    homeDuringAppt: z.boolean(),
    residenceType: z.enum(["house", "townhouse", "apartment"]).optional(),
    parkingType: z.enum(["street", "driveway", "garage", "lot"]).optional(),
    accessCode: z.string().optional(),
    entryInstructions: z.string().optional(),
    cleaningInstructions: z.string().optional(),
    acceptedTerms: z.boolean(),
  }),
  pricing: z.object({
    base: z.number(),
    extras: z.number(),
    total: z.number(),
    durationMinutes: z.number(),
  }),
  meta: z.object({
    step: z.number(),
    createdAt: z.string(),
  }),
});

export type BookingDraft = z.infer<typeof bookingDraftSchema>;

export const defaultDraft: BookingDraft = {
  address: {},
  cleanType: "deep",
  beds: 1,
  baths: 1,
  cleanliness: 3,
  kids: false,
  pets: false,
  extras: [],
  schedule: {},
  contact: {},
  logistics: {
    homeDuringAppt: false,
    acceptedTerms: false,
  },
  pricing: {
    base: 0,
    extras: 0,
    total: 0,
    durationMinutes: 0,
  },
  meta: {
    step: 0,
    createdAt: new Date().toISOString(),
  },
};

export const CLEAN_TYPES = [
  {
    id: "tidy",
    title: "Tidy",
    priceFrom: 95,
    durationMinutes: 60,
    description: ["Light reset", "Small spaces", "Quick refresh"],
  },
  {
    id: "basic",
    title: "Basic",
    priceFrom: 140,
    durationMinutes: 120,
    description: ["Standard clean", "Regular upkeep", "Kitchen + baths"],
  },
  {
    id: "deep",
    title: "Deep",
    priceFrom: 220,
    durationMinutes: 210,
    badge: "MOST POPULAR",
    description: ["Detailed clean", "Baseboards", "High-touch areas"],
  },
  {
    id: "moving",
    title: "Moving",
    priceFrom: 260,
    durationMinutes: 240,
    description: ["Move-in/out", "Cabinet fronts", "Appliance wipe-down"],
  },
] as const;

export const EXTRAS = [
  { id: "inside_fridge", label: "Inside Refrigerator", price: 25, durationMinutes: 30 },
  { id: "inside_oven", label: "Inside Oven", price: 35, durationMinutes: 30 },
  { id: "windows", label: "Interior Windows", price: 40, durationMinutes: 45 },
  { id: "laundry", label: "Laundry (1 load)", price: 15, durationMinutes: 15 },
  { id: "baseboards", label: "Baseboards", price: 30, durationMinutes: 30 },
] as const;

export const CLEANLINESS_LABELS: Record<number, string> = {
  1: "It’s messy",
  2: "Needs a reset",
  3: "Somewhere in between",
  4: "I keep a clean home",
  5: "Very tidy",
};

export const STEP_LABELS = [
  "GET STARTED",
  "CREATE YOUR CLEAN",
  "TIME & DATE",
  "YOUR DETAILS",
  "YOUR ADDRESS",
  "PAYMENT",
] as const;
