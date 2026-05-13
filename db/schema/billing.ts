import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orgs } from "./orgs";
import { runs } from "./runs";

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().unique().references(() => orgs.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planCode: text("plan_code").notNull().default("spark"), // spark | scholar | lab
  billingInterval: text("billing_interval").notNull().default("month"), // month | year
  status: text("status").notNull().default("active"), // active | past_due | canceled
  creditsRemaining: integer("credits_remaining").notNull().default(300),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => orgs.id, { onDelete: "cascade" }),
  runId: text("run_id").references(() => runs.id, { onDelete: "set null" }),
  delta: integer("delta").notNull(), // negative = consumption, positive = grant
  balanceAfter: integer("balance_after").notNull(),
  reason: text("reason").notNull(), // ideation_run | monthly_grant | upgrade_bonus | manual_topup
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
