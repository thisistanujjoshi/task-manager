import { useEffect, useState, type FormEvent } from "react";
import { api, type Task } from "./api";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(currentSearch: string) {
    try {
      setError(null);
      setTasks(await api.listTasks(currentSearch));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    await refresh(search);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createTask(title, tags);
      setTitle("");
      setTags("");
      await refresh(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create task");
    }
  }

  async function toggleDone(task: Task) {
    try {
      await api.updateTask(task.id, { done: task.done ? false : true });
      await refresh(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTask(id);
      await refresh(search);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task");
    }
  }

  return (
    <div className="app">
      <h1>Task Manager</h1>

      <form className="search" onSubmit={handleSearch}>
        <input
          placeholder="Search by title or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <form className="create" onSubmit={handleCreate}>
        <input
          placeholder="New task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          placeholder="tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="empty">No tasks yet.</p>
      ) : (
        <ul className="tasks">
          {tasks.map((task) => (
            <li key={task.id} className={task.done ? "done" : ""}>
              <label>
                <input
                  type="checkbox"
                  checked={!!task.done}
                  onChange={() => toggleDone(task)}
                />
                <span className="title">{task.title}</span>
              </label>
              {task.tags && <span className="tags">{task.tags}</span>}
              <button className="delete" onClick={() => handleDelete(task.id)}>
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
