import { createTRPCRouter } from "~/server/trpc/main";
import { createSEOMetadata } from "../procedures/seo/createSEOMetadata";
import { getSEOMetadata } from "../procedures/seo/getSEOMetadata";
import { updateSEOMetadata } from "../procedures/seo/updateSEOMetadata";
import { deleteSEOMetadata } from "../procedures/seo/deleteSEOMetadata";
import { generateSitemap } from "../procedures/seo/generateSitemap";

export const seoRouter = createTRPCRouter({
  createSEOMetadata,
  getSEOMetadata,
  updateSEOMetadata,
  deleteSEOMetadata,
  generateSitemap,
});
