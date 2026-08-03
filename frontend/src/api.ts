export interface Task {
  id: number;
  title: string;
  tags: string;
  done: number;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive the httpOnly auth cookie
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  signup: (username: string, password: string) =>
    request<User>("/auth/signup", { method: "POST", body: JSON.stringify({ username, password }) }),

  login: (username: string, password: string) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  listTasks: (search = "") =>
    request<Task[]>(`/tasks${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  createTask: (title: string, tags: string) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify({ title, tags }) }),

  updateTask: (id: number, patch: { title?: string; tags?: string; done?: boolean }) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
