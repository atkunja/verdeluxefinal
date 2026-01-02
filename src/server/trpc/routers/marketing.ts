
import { z } from "zod";
import { createTRPCRouter, requireAdmin, baseProcedure as publicProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { createCampaign } from "../procedures/marketing/createCampaign";
import { scheduleCampaign } from "../procedures/marketing/scheduleCampaign";

export const marketingRouter = createTRPCRouter({
  createCampaign,
  scheduleCampaign,

  // --- COUPONS ---
  createCoupon: requireAdmin
    .input(z.object({
      code: z.string().min(3),
      discountType: z.enum(["PERCENT", "FIXED_AMOUNT"]),
      discountAmount: z.number().positive(),
      expirationDate: z.string().optional(), // ISO String
      maxUses: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      // Basic check for uniqueness handled by db constraints, but let's be safe
      return await db.coupon.create({
        data: {
          code: input.code.toUpperCase(),
          discountType: input.discountType,
          discountAmount: input.discountAmount,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
          maxUses: input.maxUses,
        },
      });
    }),

  getCoupons: requireAdmin.query(async () => {
    return await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }),

  deleteCoupon: requireAdmin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.coupon.delete({ where: { id: input.id } });
    }),

  validateCoupon: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const coupon = await db.coupon.findUnique({ where: { code: input.code.toUpperCase() } });

      if (!coupon || !coupon.isActive) {
        throw new Error("Invalid or inactive coupon code.");
      }

      if (coupon.expirationDate && new Date() > coupon.expirationDate) {
        throw new Error("This coupon has expired.");
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new Error("This coupon is no longer available.");
      }

      return {
        valid: true,
        discountType: coupon.discountType,
        discountAmount: coupon.discountAmount,
        code: coupon.code,
      };
    }),

  // --- BLOG ---
  getPosts: requireAdmin.query(async () => {
    return await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  }),

  getPost: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await db.blogPost.findUnique({ where: { slug: input.slug } });
      if (!post || (!post.isPublished)) {
        // In future we can add admin bypass here
        // if (ctx.session?.user?.role === 'ADMIN') return post;
        return null;
      }
      return post;
    }),

  getPublicPosts: publicProcedure.query(async () => {
    return await db.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true }
    });
  }),

  createPost: requireAdmin
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      content: z.string(),
      excerpt: z.string().optional(),
      coverImage: z.string().optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.blogPost.create({
        data: input,
      });
    }),

  updatePost: requireAdmin
    .input(z.object({
      id: z.number(),
      title: z.string(),
      slug: z.string(),
      content: z.string(),
      excerpt: z.string().optional(),
      coverImage: z.string().optional(),
      isPublished: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db.blogPost.update({
        where: { id },
        data
      });
    }),

  deletePost: requireAdmin.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return await db.blogPost.delete({ where: { id: input.id } });
  }),

  // --- LOCATIONS ---
  getLocationPages: requireAdmin.query(async () => {
    return await db.locationPage.findMany({ orderBy: { city: "asc" } });
  }),

  getLocationPage: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await db.locationPage.findUnique({ where: { slug: input.slug } });
    }),

  createLocationPage: requireAdmin
    .input(z.object({
      city: z.string(),
      slug: z.string(),
      content: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.locationPage.create({
        data: input,
      });
    }),

  deleteLocationPage: requireAdmin.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    return await db.locationPage.delete({ where: { id: input.id } });
  }),
});
