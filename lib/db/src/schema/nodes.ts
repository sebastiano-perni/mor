import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nodesTable = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cpuCores: integer("cpu_cores").notNull(),
  gpuCount: integer("gpu_count").notNull().default(0),
  memoryGB: integer("memory_gb").notNull(),
  status: text("status").notNull().default("active"),
  cpuLoad: real("cpu_load").notNull().default(0),
  gpuLoad: real("gpu_load").notNull().default(0),
  memoryLoad: real("memory_load").notNull().default(0),
  partition: text("partition").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertNodeSchema = createInsertSchema(nodesTable).omit({ id: true, updatedAt: true });
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodesTable.$inferSelect;
