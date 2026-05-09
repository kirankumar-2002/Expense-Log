import { pgTable, uuid, text, timestamp, bigint, jsonb, pgSchema } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Supabase 'auth' schema reference
 */
export const authSchema = pgSchema("auth");

/**
 * Reference to Supabase's managed 'users' table in the 'auth' schema.
 * We reference this to link our 'profiles' table to the actual auth user.
 */
export const authUsers = authSchema.table("users", {
	id: uuid("id").primaryKey(),
});

/**
 * Profiles Table
 * Linked 1:1 with auth.users.
 * Serves as the source of truth for the 'tenant_id'.
 */
export const profiles = pgTable("profiles", {
	id: uuid("id")
		.primaryKey()
		.references(() => authUsers.id, { onDelete: "cascade" }),
	email: text("email").notNull(),
	fullName: text("full_name"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Categories Table
 * Multi-tenant using tenant_id.
 */
export const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	colorCode: text("color_code"),
	icon: text("icon"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Transactions Table
 * Multi-tenant using tenant_id.
 * Monetary values stored as BIGINT in cents.
 */
export const transactions = pgTable("transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	profileId: uuid("profile_id")
		.notNull()
		.references(() => profiles.id),
	categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
	amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
	description: text("description"),
	transactionDate: timestamp("transaction_date").defaultNow().notNull(),
	metadata: jsonb("metadata").$type<Record<string, any>>(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Idempotency Keys Table
 * Stores responses for POST/PUT requests to prevent duplicate processing.
 */
export const idempotencyKeys = pgTable("idempotency_keys", {
	id: uuid("id").primaryKey().defaultRandom(),
	key: uuid("key").notNull(), // The client-provided UUID
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	responseCode: bigint("response_code", { mode: "number" }).notNull(),
	responseBody: jsonb("response_body").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Accounts Table
 * Standard bank accounts.
 */
export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	type: text("type").notNull().default("Current"),
	balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
	month: text("month"),
	lastUpdated: timestamp("last_updated").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Wallets Table
 * Cash and digital wallets.
 */
export const wallets = pgTable("wallets", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
	lastUpdated: timestamp("last_updated").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Credit Cards Table
 */
export const creditCards = pgTable("credit_cards", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	limitCents: bigint("limit_cents", { mode: "number" }).notNull().default(0),
	balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
	lastUpdated: timestamp("last_updated").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Outstanding Entries Table
 * Tracking pending items that require action.
 */
export const outstandingEntries = pgTable("outstanding_entries", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
	dueDate: timestamp("due_date"),
	status: text("status").notNull().default("Pending"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Payable/Receivable Table
 * For tracking debts and credits.
 */
export const payableReceivable = pgTable("payable_receivable", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	entityName: text("entity_name").notNull(),
	type: text("type").notNull(), // 'Payable' or 'Receivable'
	amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
	description: text("description"),
	dueDate: timestamp("due_date"),
	status: text("status").notNull().default("Open"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Expenses Table
 * Granular expense tracking.
 */
export const expenses = pgTable("expenses", {
	id: uuid("id").primaryKey().defaultRandom(),
	tenantId: uuid("tenant_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	categoryId: uuid("category_id").references(() => categories.id),
	amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
	description: text("description"),
	expenseDate: timestamp("expense_date").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});



