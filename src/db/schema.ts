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
 * Serves as the source of truth for the 'user_id'.
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
 * Multi-tenant using user_id.
 */
export const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	colorCode: text("color_code"),
	icon: text("icon"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Transactions Table
 * Multi-tenant using user_id.
 */
export const transactions = pgTable("transactions", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id")
		.notNull()
		.default(sql`auth.uid()`)
		.references(() => authUsers.id, { onDelete: "cascade" }),
	date: text("date").notNull().default(sql`CURRENT_DATE`),
	amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
	state: text("state").notNull().default("Payable"),
	category: text("category").notNull().default(""),
	subCategory: text("sub_category").notNull().default(""),
	status: text("status").notNull().default("Pending"),
	accounts: text("accounts").notNull().default(""),
	description: text("description").notNull().default(""),
	notes: text("notes").notNull().default(""),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Outstanding Entries Table
 */
export const outstandingEntries = pgTable("outstanding", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id")
		.notNull()
		.default(sql`auth.uid()`)
		.references(() => authUsers.id, { onDelete: "cascade" }),
	date: text("date").notNull().default(sql`CURRENT_DATE`),
	amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
	state: text("state").notNull().default("Payable"),
	category: text("category").notNull().default(""),
	subCategory: text("sub_category").notNull().default(""),
	status: text("status").notNull().default("Pending"),
	accounts: text("accounts").notNull().default(""),
	description: text("description").notNull().default(""),
	notes: text("notes").notNull().default(""),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Accounts Table
 */
export const accounts = pgTable("accounts", {
	id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	userId: uuid("user_id")
		.notNull()
		.default(sql`auth.uid()`)
		.references(() => authUsers.id, { onDelete: "cascade" }),
	name: text("name").notNull().default(""),
	bank: text("bank").notNull().default(""),
	type: text("type").notNull().default("Current"),
	balanceCents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
	standardBalanceCents: bigint("standard_balance_cents", { mode: "number" }).notNull().default(0),
	month: text("month").notNull().default(""),
	lastUpdated: timestamp("last_updated").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});





