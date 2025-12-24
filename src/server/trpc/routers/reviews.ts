import { createTRPCRouter } from "~/server/trpc/main";
import { getReviewsAdmin } from "../procedures/admin/getReviewsAdmin";
import { deleteReviewAdmin } from "../procedures/admin/deleteReviewAdmin";
import { updateReviewAdmin } from "../procedures/admin/updateReviewAdmin";

export const reviewsRouter = createTRPCRouter({
    getReviewsAdmin,
    deleteReviewAdmin,
    updateReviewAdmin,
});
