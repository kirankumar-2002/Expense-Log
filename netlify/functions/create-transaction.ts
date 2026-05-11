import { Handler } from "@netlify/functions";
import { z } from "zod";
import { verifyAuth } from "./lib/auth";
import { successResponse, errorResponse } from "./lib/response";
import { checkIdempotency } from "./lib/idempotency";
import { db, sql } from "../../src/db";
import { eq } from "drizzle-orm";
import { transactions, categories, idempotencyKeys } from "../../src/db/schema";


/**
 * Transaction Creation Schema
 */
const createTransactionSchema = z.object({
	amount_cents: z.number().int().positive("Amount must be a positive integer in cents"),
	category_id: z.string().uuid("Invalid category ID"),
	description: z.string().max(255).optional(),
	transaction_date: z.iso.datetime().optional(),
	metadata: z.record(z.string(), z.any()).optional(),
});

export const handler: Handler = async (event) => {
	// 1. Only allow POST
	if (event.httpMethod !== "POST") {
		return errorResponse("Method not allowed", "METHOD_NOT_ALLOWED", 405);
	}

	try {
		// 2. Verify Authentication
		const user = await verifyAuth(event.headers.authorization);

		// 3. Check Idempotency
		const idempotencyKey = event.headers["idempotency-key"] || event.headers["Idempotency-Key"];
		if (idempotencyKey) {
			const cachedResponse = await checkIdempotency(idempotencyKey as string, user.id);
			if (cachedResponse) return cachedResponse;
		}

		// 4. Parse and Validate Request Body
		const body = JSON.parse(event.body || "{}");
		const validatedData = createTransactionSchema.safeParse(body);

		if (!validatedData.success) {
			return errorResponse(
				validatedData.error.issues[0].message,
				"VALIDATION_ERROR",
				422
			);
		}

		const { amount_cents, category_id, description, transaction_date, metadata } = validatedData.data;

		// 5. Insert Transaction with RLS Context and Idempotency Tracking
		const finalResponse = await db.transaction(async (tx) => {
			// Set RLS Context
			await tx.execute(sql`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: user.id })}, true)`);

			// Fetch category name to match schema
			const [categoryRecord] = await tx
				.select({ name: categories.name })
				.from(categories)
				.where(eq(categories.id, category_id))
				.limit(1);

			const [newTransaction] = await tx
				.insert(transactions)
				.values({
					userId: user.id,
					amountCents: amount_cents,
					category: categoryRecord?.name || "Uncategorized",
					description: description || "",
					date: transaction_date ? transaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
				})
				.returning();
			
			const response = successResponse(newTransaction, 201);

			// Save Idempotency
			if (idempotencyKey) {
				await tx.insert(idempotencyKeys).values({
					key: idempotencyKey as string,
					userId: user.id,
					responseCode: response.statusCode,
					responseBody: JSON.parse(response.body || "{}"),
				});
			}

			return response;
		});

		return finalResponse;
	} catch (error: any) {

		console.error("Error in create-transaction:", error);
		
		if (error.message === "Unauthorized") {
			return errorResponse("Unauthorized", "UNAUTHORIZED", 401);
		}
		
		if (error instanceof SyntaxError) {
			return errorResponse("Invalid JSON body", "BAD_REQUEST", 400);
		}

		return errorResponse(
			"An unexpected error occurred",
			"INTERNAL_SERVER_ERROR",
			500
		);
	}
};
