import { blob } from "hub:blob";

export default defineEventHandler(async (event) => {
  const form = await readFormData(event);
  const file = form.get("file") as File;

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  // Ensure unique pathname or sanitize name
  const pathname = `${Date.now()}-${file.name}`;
  const uploadedBlob = await blob.put(pathname, file, {
    addRandomSuffix: false,
  });

  return uploadedBlob;
});
