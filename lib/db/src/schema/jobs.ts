import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  jobName: text("job_name").notNull(),
  status: text("status").notNull().default("queued"),
  cpuRequired: integer("cpu_required").notNull(),
  gpuRequired: integer("gpu_required").notNull().default(0),
  memoryGB: integer("memory_gb").notNull(),
  wallHours: integer("wall_hours").notNull(),
  partition: text("partition").notNull(),
  priority: integer("priority").notNull().default(1),
  note: text("note"),
  queuePosition: integer("queue_position"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  estimatedStartAt: timestamp("estimated_start_at", { withTimezone: true }),
  estimatedCompletedAt: timestamp("estimated_completed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  progress: real("progress"),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, submittedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
