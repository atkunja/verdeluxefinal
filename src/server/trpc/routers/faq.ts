import { createTRPCRouter } from "~/server/trpc/main";
import { createFaq } from "../procedures/faq/createFaq";
import { getFaqs } from "../procedures/faq/getFaqs";
import { updateFaq } from "../procedures/faq/updateFaq";
import { deleteFaq } from "../procedures/faq/deleteFaq";

export const faqRouter = createTRPCRouter({
  createFaq,
  getFaqs,
  updateFaq,
  deleteFaq,
});
