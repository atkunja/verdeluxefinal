import { createTRPCRouter } from "~/server/trpc/main";
import { getReviewsAdmin } from "../procedures/admin/getReviewsAdmin";
import { deleteReviewAdmin } from "../procedures/admin/deleteReviewAdmin";
import { updateReviewAdmin } from "../procedures/admin/updateReviewAdmin";
import { getPublicReviews } from "../procedures/reviews/getPublicReviews";

export const reviewsRouter = createTRPCRouter({
    getReviewsAdmin,
    deleteReviewAdmin,
    updateReviewAdmin,
    getPublicReviews,
});
