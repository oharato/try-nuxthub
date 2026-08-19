import { todos } from "../../database/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID is required" });
  }

  const db = useDrizzle();
  const [updated] = await db
    .update(todos)
    .set({ completed: body.completed })
    .where(eq(todos.id, Number(id)))
    .returning();

  return updated;
});
