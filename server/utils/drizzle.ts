import { db, schema } from "hub:db";

export { sql, eq, and, or, desc, asc, inArray, like } from "drizzle-orm";
export const tables = schema;

export function useDrizzle() {
  return db;
}

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Category = typeof schema.categories.$inferSelect;
export type NewCategory = typeof schema.categories.$inferInsert;

export type Product = typeof schema.products.$inferSelect;
export type NewProduct = typeof schema.products.$inferInsert;

export type ProductImage = typeof schema.productImages.$inferSelect;
export type NewProductImage = typeof schema.productImages.$inferInsert;

export type Order = typeof schema.orders.$inferSelect;
export type NewOrder = typeof schema.orders.$inferInsert;

export type OrderItem = typeof schema.orderItems.$inferSelect;
export type NewOrderItem = typeof schema.orderItems.$inferInsert;

export type Review = typeof schema.reviews.$inferSelect;
export type NewReview = typeof schema.reviews.$inferInsert;

export type JobLog = typeof schema.jobLogs.$inferSelect;
export type NewJobLog = typeof schema.jobLogs.$inferInsert;

export type Todo = typeof schema.todos.$inferSelect;
export type NewTodo = typeof schema.todos.$inferInsert;
