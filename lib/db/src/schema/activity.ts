import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTable = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  severity: text("severity").notNull().default("info"),
  jobId: integer("job_id"),
  userId: integer("user_id"),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, timestamp: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type ActivityEvent = typeof activityTable.$inferSelect;
