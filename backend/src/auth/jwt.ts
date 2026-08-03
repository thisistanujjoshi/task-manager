import jwt from "jsonwebtoken";
import crypto from "node:crypto";

// A real deployment must set JWT_SECRET explicitly (e.g. in the host's
// env config) — a secret generated at boot means every restart
// invalidates all existing sessions, which is fine for local dev but
// not for production.
const secret = process.env.JWT_SECRET ?? crypto.randomBytes(32).toString("hex");
if (!process.env.JWT_SECRET) {
  console.warn(
    "[auth] JWT_SECRET not set — using a random secret for this process only. " +
      "Sessions will not survive a server restart. Set JWT_SECRET in .env for anything beyond local dev."
  );
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, secret) as AuthTokenPayload;
}
