import { Router } from "express";
import { db } from "../db/index.js";
import type { AuthedRequest } from "../auth/middleware.js";

export const tasksRouter = Router();

// GET /tasks?search=term  -> list the current user's tasks, optionally filtered
tasksRouter.get("/", (req: AuthedRequest, res) => {
  const search = String(req.query.search ?? "").trim();

  const rows = search
    ? db
        .prepare(
          "SELECT * FROM tasks WHERE user_id = ? AND (title LIKE ? OR tags LIKE ?) ORDER BY created_at DESC"
        )
        .all(req.userId!, `%${search}%`, `%${search}%`)
    : db
        .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
        .all(req.userId!);

  res.json(rows);
});

// POST /tasks -> create a task owned by the current user
tasksRouter.post("/", (req: AuthedRequest, res) => {
  const { title, tags } = req.body as { title?: string; tags?: string };

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const result = db
    .prepare("INSERT INTO tasks (user_id, title, tags) VALUES (?, ?, ?)")
    .run(req.userId!, title.trim(), tags ?? "");

  const created = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(created);
});

// PATCH /tasks/:id -> update a task, only if it belongs to the current user
tasksRouter.patch("/:id", (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const existing = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(id, req.userId!);

  if (!existing) {
    return res.status(404).json({ error: "task not found" });
  }

  const { title, tags, done } = req.body as {
    title?: string;
    tags?: string;
    done?: boolean;
  };

  db.prepare(
    "UPDATE tasks SET title = ?, tags = ?, done = ? WHERE id = ? AND user_id = ?"
  ).run(
    title ?? (existing as any).title,
    tags ?? (existing as any).tags,
    done === undefined ? (existing as any).done : done ? 1 : 0,
    id,
    req.userId!
  );

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /tasks/:id -> only if it belongs to the current user
tasksRouter.delete("/:id", (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const result = db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(id, req.userId!);

  if (Number(result.changes) === 0) {
    return res.status(404).json({ error: "task not found" });
  }

  res.status(204).send();
});
