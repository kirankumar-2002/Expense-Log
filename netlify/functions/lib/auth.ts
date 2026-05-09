import { jwtVerify } from "jose";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export interface UserContext {
	id: string;
	email?: string;
	role?: string;
}

export async function verifyAuth(authHeader?: string): Promise<UserContext> {
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		throw new Error("Missing or invalid authorization header");
	}

	if (!JWT_SECRET) {
		throw new Error("SUPABASE_JWT_SECRET is not configured");
	}

	const token = authHeader.split(" ")[1];
	const secret = new TextEncoder().encode(JWT_SECRET);

	try {
		const { payload } = await jwtVerify(token, secret);
		
		if (!payload.sub) {
			throw new Error("Invalid token payload: missing 'sub'");
		}

		return {
			id: payload.sub,
			email: payload.email as string,
			role: payload.role as string,
		};
	} catch (error) {
		console.error("JWT Verification failed:", error);
		throw new Error("Unauthorized");
	}
}
