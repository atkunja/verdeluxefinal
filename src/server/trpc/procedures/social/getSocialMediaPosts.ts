import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const getSocialMediaPosts = baseProcedure.query(async () => {
  const posts = await db.socialMediaPost.findMany();
  return posts;
});
