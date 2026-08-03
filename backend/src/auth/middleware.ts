import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./jwt.js";

export interface AuthedRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return res.status(401).json({ error: "not authenticated" });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired session" });
  }
}
