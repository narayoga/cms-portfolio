import type { Response } from 'express';

/**
 * Send a successful JSON response:  { ok: true, data: ... }
 */
export function sendOk(response: Response, data: unknown = null): void {
  response.status(200).json({ ok: true, data: data });
}

/**
 * Send an error JSON response:  { ok: false, error: "..." }
 * Extra fields (optional) are added next to "error".
 */
export function sendError(
  response: Response,
  message: string,
  statusCode: number = 400,
  extraFields: Record<string, unknown> = {}
): void {
  const body = { ok: false, error: message, ...extraFields };
  response.status(statusCode).json(body);
}
