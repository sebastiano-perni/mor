import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partitionsTable = pgTable("partitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  maxWallHours: integer("max_wall_hours").notNull(),
  maxCpus: integer("max_cpus").notNull(),
  maxMemoryGB: integer("max_memory_gb").notNull(),
  maxGpus: integer("max_gpus").notNull().default(0),
  description: text("description").notNull(),
  priority: integer("priority").notNull().default(1),
});

export const insertPartitionSchema = createInsertSchema(partitionsTable).omit({ id: true });
export type InsertPartition = z.infer<typeof insertPartitionSchema>;
export type Partition = typeof partitionsTable.$inferSelect;
