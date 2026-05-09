import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.warn("DATABASE_URL is not set. Database connections will fail.");
}

const client = postgres(DATABASE_URL!);
export const db = drizzle(client, { schema });

/**
 * Helper to run queries with RLS context.
 * Sets the 'request.jwt.claims' locally within a transaction.
 */
export async function withRLS<T>(userId: string, callback: (tx: any) => Promise<T>): Promise<T> {
	return await db.transaction(async (tx) => {
		// Set the user context for Supabase RLS policies
		await tx.execute(sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`);
		return await callback(tx);
	});
}

// Re-export sql for convenience
import { sql } from "drizzle-orm";
export { sql };
