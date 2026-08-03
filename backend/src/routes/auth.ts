import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { signToken } from "../auth/jwt.js";
import { requireAuth, type AuthedRequest } from "../auth/middleware.js";

export const authRouter = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

authRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !username.trim() || !password || password.length < 8) {
    return res
      .status(400)
      .json({ error: "username is required and password must be at least 8 characters" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username.trim());
  if (existing) {
    return res.status(409).json({ error: "username already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username.trim(), passwordHash);

  const userId = Number(result.lastInsertRowid);
  const token = signToken({ userId, username: username.trim() });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ id: userId, username: username.trim() });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username?.trim()) as { id: number; username: string; password_hash: string } | undefined;

  const valid = user ? await bcrypt.compare(password ?? "", user.password_hash) : false;
  if (!user || !valid) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  const token = signToken({ userId: user.id, username: user.username });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({ id: user.id, username: user.username });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  const user = db
    .prepare("SELECT id, username FROM users WHERE id = ?")
    .get(req.userId!);
  res.json(user);
});
