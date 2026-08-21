import { useDrizzle, tables, desc } from "../../../utils/drizzle";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user || (session.user as any).role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者権限が必要です。" });
  }

  const db = useDrizzle();
  const logs = await db.select().from(tables.jobLogs).orderBy(desc(tables.jobLogs.createdAt));

  return logs;
});
