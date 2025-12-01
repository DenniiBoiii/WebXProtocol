import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const blueprints = pgTable("blueprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  layout: text("layout").notNull(),
  payload: text("payload").notNull(), // encoded WebX payload
  rawData: jsonb("raw_data").notNull(), // full blueprint JSON for querying
  category: text("category"),
  author: text("author"),
  featured: boolean("featured").default(false),
  downloads: integer("downloads").default(0),
  contentHash: text("content_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlueprintSchema = createInsertSchema(blueprints).omit({
  id: true,
  createdAt: true,
});

export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type Blueprint = typeof blueprints.$inferSelect;
