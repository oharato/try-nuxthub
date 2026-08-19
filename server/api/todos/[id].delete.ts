import { todos } from "../../database/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }

  const db = useDrizzle();
  await db.delete(todos).where(eq(todos.id, Number(id)));

  return { success: true };
});
