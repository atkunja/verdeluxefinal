import { createTRPCRouter } from "~/server/trpc/main";
import { createSocialMediaPost } from "../procedures/social/createSocialMediaPost";
import { getSocialMediaPosts } from "../procedures/social/getSocialMediaPosts";
import { updateSocialMediaPost } from "../procedures/social/updateSocialMediaPost";
import { deleteSocialMediaPost } from "../procedures/social/deleteSocialMediaPost";

export const socialRouter = createTRPCRouter({
  createSocialMediaPost,
  getSocialMediaPosts,
  updateSocialMediaPost,
  deleteSocialMediaPost,
});
