import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { authUsers } from "./auth";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => authUsers.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft | running | done | error
  inputMarkdown: text("input_markdown").notNull(),
  inputFiles: jsonb("input_files").$type<Array<{ url: string; filename: string; kind: string }>>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
