import { useEffect, useState } from "react";
import { api, type User } from "./api";
import { AuthForm } from "./AuthForm";
import { TaskList } from "./TaskList";
import "./App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) return null;

  return user ? (
    <TaskList user={user} onLogout={() => setUser(null)} />
  ) : (
    <AuthForm onAuthed={setUser} />
  );
}

export default App;
