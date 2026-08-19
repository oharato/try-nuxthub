import { blob } from "hub:blob";

export default defineEventHandler(async (event) => {
  const pathname = getRouterParam(event, "pathname");

  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: "Pathname is required" });
  }

  await blob.delete(decodeURIComponent(pathname));
  return { success: true };
});
