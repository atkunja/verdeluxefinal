import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { env } from "~/server/env";

export const getSchedule = baseProcedure
  .input(z.object({}).optional())
  .query(async ({ input, ctx }) => {
    try {
      let user = ctx.profile;

      // If not in context, try supplied token (Supabase) as a fallback
      if (!user && ctx.token) {
        const supa = await supabaseServer.auth.getUser(ctx.token);
        const email = supa?.data?.user?.email;
        if (email) {
          const dbUser = await db.user.findUnique({ where: { email } });
          if (dbUser) {
            user = {
              id: dbUser.id,
              email: dbUser.email,
              role: dbUser.role,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              adminPermissions: dbUser.adminPermissions as any,
            };
          }
        }
      }

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.role !== "CLEANER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only cleaners can access schedules",
        });
      }

      // Fetch bookings assigned to this cleaner
      const bookings = await db.booking.findMany({
        where: {
          cleanerId: user.id,
        },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          checklist: {
            include: {
              items: {
                orderBy: {
                  order: "asc",
                },
              },
              template: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledDate: "asc",
        },
      });

      // Derive status: any booking with a past scheduled date should be treated as completed (unless cancelled)
      const now = new Date();
      const bookingsWithDerivedStatus = bookings.map((booking) => {
        const scheduledDate = new Date(booking.scheduledDate);
        
        if (scheduledDate < now && booking.status !== "CANCELLED") {
          return {
            ...booking,
            status: "COMPLETED" as const,
          };
        }
        
        return booking;
      });

      return { bookings: bookingsWithDerivedStatus };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
