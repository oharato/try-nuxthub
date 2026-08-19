import { todos } from "../../database/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.title || typeof body.title !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Title is required",
    });
  }

  const db = useDrizzle();
  const [todo] = await db
    .insert(todos)
    .values({
      title: body.title.trim(),
    })
    .returning();

  return todo;
});
