import { HandlerResponse } from "@netlify/functions";
import { db, sql } from "../../../src/db";
import { idempotencyKeys } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";

export async function checkIdempotency(
	key: string,
	userId: string
): Promise<HandlerResponse | null> {
	if (!key) return null;

	const [existing] = await db
		.select()
		.from(idempotencyKeys)
		.where(
			and(
				eq(idempotencyKeys.key, key),
				eq(idempotencyKeys.userId, userId)
			)
		)
		.limit(1);

	if (existing) {
		// Key was found, return the cached response
		return {
			statusCode: existing.responseCode,
			headers: { 
				"Content-Type": "application/json",
				"X-Idempotency-Cached": "true"
			},
			body: JSON.stringify(existing.responseBody),
		};
	}

	return null;
}

export async function saveIdempotency(
	key: string,
	userId: string,
	response: HandlerResponse
) {
	if (!key) return;

	await db.insert(idempotencyKeys).values({
		key: key,
		userId: userId,
		responseCode: response.statusCode,
		responseBody: JSON.parse(response.body || "{}"),
	});
}
