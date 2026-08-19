import { blob } from "hub:blob";

export default defineEventHandler(async () => {
  return await blob.list();
});
