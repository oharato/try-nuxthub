import { todos } from "../../database/schema";
import { desc } from "drizzle-orm";

export default defineEventHandler(async () => {
  const db = useDrizzle();
  return await db.select().from(todos).orderBy(desc(todos.createdAt));
});
