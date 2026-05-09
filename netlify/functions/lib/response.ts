import { HandlerResponse } from "@netlify/functions";

export const successResponse = (data: any, statusCode = 200): HandlerResponse => ({
	statusCode,
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ data }),
});

export const errorResponse = (
	message: string,
	code: string,
	statusCode = 400
): HandlerResponse => ({
	statusCode,
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		error: { code, message },
	}),
});
