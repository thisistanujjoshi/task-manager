import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { tasksRouter } from "./routes/tasks.js";
import { authRouter } from "./routes/auth.js";
import { requireAuth } from "./auth/middleware.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file — fine for local dev, see backend/.env.example
}

const app = express();
const PORT = process.env.PORT ?? 4000;

// credentials: true + an explicit origin (not "*") are both required for
// the browser to actually send/accept the auth cookie cross-origin.
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/tasks", requireAuth, tasksRouter);

app.listen(PORT, () => {
  console.log(`task-manager-backend listening on http://localhost:${PORT}`);
});
