import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { authUsers } from "./auth";

export const runs = pgTable("runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdBy: text("created_by").notNull().references(() => authUsers.id),
  type: text("type").notNull(), // ideation | rank | tournament | writeup | deep_critique
  status: text("status").notNull().default("queued"), // queued | running | done | error
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  costCredits: integer("cost_credits").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artifacts = pgTable("artifacts", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // idea_json | ranking_md | tournament_md | paper_pdf | paper_tex | critique_md
  filename: text("filename").notNull(),
  s3Url: text("s3_url").notNull(),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
