import { useDrizzle, tables } from "../../utils/drizzle";
import { ensureSeedData } from "../../utils/seed";

export default defineEventHandler(async () => {
  await ensureSeedData();
  const db = useDrizzle();
  const categories = await db.select().from(tables.categories);
  return categories;
});
