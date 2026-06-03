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
export const docStatusEnum = pgEnum("doc_status", ["draft", "generated", "downloaded", "archived", "issued"]);
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

// ── Pending Invitations ──────────────────────────────────────

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
]);

export const pendingInvitations = pgTable("pending_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  email: text("email").notNull(),
  clerkInvitationId: text("clerk_invitation_id"),
  invitedBy: text("invited_by"),
  status: invitationStatusEnum("status").notNull().default("pending"),
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
  currentIssuedVersion: integer("current_issued_version"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ── Change Types for Version History ──────────────────────────────
export const changeTypeEnum = pgEnum("change_type", [
  "initial",
  "ai_edit",
  "manual_edit",
  "regenerate",
  "restore",
]);

// ── Document Versions (Audit Trail) ──────────────────────────────
// Every change to a document creates a snapshot row here.
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  outputData: jsonb("output_data").$type<Record<string, unknown>>().notNull(),
  inputData: jsonb("input_data").$type<Record<string, unknown>>(),
  changeType: changeTypeEnum("change_type").notNull(),
  changeDescription: text("change_description"),
  changedBy: text("changed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// ── Tenant Legislative Actions ──────────────────────────────────
// Tracks which tenants have actioned which legislative updates independently.

export const tenantLegislativeActions = pgTable("tenant_legislative_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  updateId: uuid("update_id")
    .notNull()
    .references(() => legislativeUpdates.id),
  actionedAt: timestamp("actioned_at").notNull().defaultNow(),
});
