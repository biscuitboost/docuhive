import { pgTable, pgEnum, uuid, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["essentials", "pro", "team"]);
export const tenantRoleEnum = pgEnum("tenant_role", ["owner", "admin", "member"]);
export const docTypeEnum = pgEnum("doc_type", [
  "employment_contract",
  "offer_letter",
  "staff_handbook",
  "payslip",
  "p45",
  "custom",
]);
export const docStatusEnum = pgEnum("doc_status", ["draft", "generated", "downloaded", "archived"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "cancelled",
  "trialing",
]);

// ── Tenants ──────────────────────────────────────────────────────

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  plan: planEnum("plan").notNull().default("essentials"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Tenant Members ───────────────────────────────────────────────

export const tenantMembers = pgTable("tenant_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  clerkUserId: text("clerk_user_id").notNull(),
  role: tenantRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Documents ────────────────────────────────────────────────────

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  type: docTypeEnum("type").notNull(),
  title: text("title").notNull(),
  status: docStatusEnum("status").notNull().default("draft"),
  inputData: jsonb("input_data").$type<Record<string, unknown>>(),
  outputData: jsonb("output_data").$type<Record<string, unknown>>(),
  outputUrl: text("output_url"),
  aiModel: text("ai_model"),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Document Templates ───────────────────────────────────────────

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: docTypeEnum("type").notNull(),
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  promptTemplate: text("prompt_template").notNull(),
  schema: jsonb("schema").$type<Record<string, unknown>>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Subscriptions ────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  plan: planEnum("plan").notNull(),
  documentsUsed: integer("documents_used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Legislative Updates ──────────────────────────────────────────

export const legislativeUpdates = pgTable("legislative_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  affectedTemplateTypes: text("affected_template_types").array(),
  effectiveDate: timestamp("effective_date"),
  isActioned: boolean("is_actioned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
