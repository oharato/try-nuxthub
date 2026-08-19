import { db, schema } from "hub:db";

export { sql, eq, and, or, desc, asc } from "drizzle-orm";
export const tables = schema;

export function useDrizzle() {
  return db;
}

export type Todo = typeof schema.todos.$inferSelect;
export type NewTodo = typeof schema.todos.$inferInsert;
