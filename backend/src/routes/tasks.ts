import { Router } from "express";
import { db } from "../db/index.js";

export const tasksRouter = Router();

// GET /tasks?search=term  -> list tasks, optionally filtered by title/tag
tasksRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();

  const rows = search
    ? db
        .prepare(
          "SELECT * FROM tasks WHERE title LIKE ? OR tags LIKE ? ORDER BY created_at DESC"
        )
        .all(`%${search}%`, `%${search}%`)
    : db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();

  res.json(rows);
});

// POST /tasks -> create a task
tasksRouter.post("/", (req, res) => {
  const { title, tags } = req.body as { title?: string; tags?: string };

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, tags) VALUES (?, ?)")
    .run(title.trim(), tags ?? "");

  const created = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(created);
});

// PATCH /tasks/:id -> update title/tags/done
tasksRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!existing) {
    return res.status(404).json({ error: "task not found" });
  }

  const { title, tags, done } = req.body as {
    title?: string;
    tags?: string;
    done?: boolean;
  };

  db.prepare(
    "UPDATE tasks SET title = ?, tags = ?, done = ? WHERE id = ?"
  ).run(
    title ?? (existing as any).title,
    tags ?? (existing as any).tags,
    done === undefined ? (existing as any).done : done ? 1 : 0,
    id
  );

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(updated);
});

// DELETE /tasks/:id
tasksRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  if (Number(result.changes) === 0) {
    return res.status(404).json({ error: "task not found" });
  }

  res.status(204).send();
});
