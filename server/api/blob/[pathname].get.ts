import { blob } from "hub:blob";

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname");

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: "Pathname is required" });
  }

  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
  return blob.serve(event, decodeURIComponent(pathname));
});
