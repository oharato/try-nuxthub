import { ensureSeedData } from "../utils/seed";

export default defineNitroPlugin(async () => {
  try {
    await ensureSeedData();
  } catch (e) {
    console.error("Failed to execute initial seed:", e);
  }
});
