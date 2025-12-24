import { defineEventHandler, readBody } from "@tanstack/react-start/server";

// Simple stub to accept client log POSTs without breaking SSR.
export default defineEventHandler(async (event) => {
  try {
    if (event.method === "POST") {
      await readBody(event);
    }
  } catch (err) {
    console.error("Failed to read client log payload", err);
  }

  return new Response(null, { status: 204 });
});
