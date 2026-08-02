import express from "express";
import cors from "cors";
import { tasksRouter } from "./routes/tasks.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/tasks", tasksRouter);

app.listen(PORT, () => {
  console.log(`task-manager-backend listening on http://localhost:${PORT}`);
});
