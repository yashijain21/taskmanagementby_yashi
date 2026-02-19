"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/toast";
import { useAuth } from "@/components/auth-context";
import { useApi } from "@/components/use-api";
import { Task, TaskListResponse, TaskStatus } from "@/lib/types";

type TaskFormState = {
  title: string;
  description: string;
};

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const { user, clearSession } = useAuth();
  const { request } = useApi();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState<TaskFormState>({ title: "", description: "" });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async (targetPage = page): Promise<void> => {
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: String(targetPage),
        pageSize: "8",
        ...(filter === "ALL" ? {} : { status: filter }),
        ...(search.trim() ? { search: search.trim() } : {})
      });

      const data = await request<TaskListResponse>(`/tasks?${query.toString()}`);
      setTasks(data.items);
      setTotalPages(Math.max(1, data.pagination.totalPages));
      setPage(data.pagination.page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tasks";
      setError(message);
      if (message.toLowerCase().includes("session expired")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    void loadTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const handleSaveTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingTaskId) {
        await request<Task>(`/tasks/${editingTaskId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: form.title,
            description: form.description || null
          })
        });
        showToast("Task updated");
      } else {
        await request<Task>("/tasks", {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            description: form.description || undefined
          })
        });
        showToast("Task created");
      }

      setForm({ title: "", description: "" });
      setEditingTaskId(null);
      await loadTasks(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description ?? ""
    });
  };

  const onDelete = async (taskId: string) => {
    try {
      await request<void>(`/tasks/${taskId}`, { method: "DELETE" });
      showToast("Task deleted");
      await loadTasks(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const onToggle = async (taskId: string) => {
    try {
      await request<Task>(`/tasks/${taskId}/toggle`, { method: "PATCH", body: JSON.stringify({}) });
      showToast("Task status updated");
      await loadTasks(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Toggle failed");
    }
  };

  const onLogout = async () => {
    try {
      await request<void>("/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch {
      // ignore logout API failures and clear local session anyway
    }
    clearSession();
    router.push("/login");
  };

  if (!user) {
    return <main className="container">Loading...</main>;
  }

  return (
    <main className="container">
      <header className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Task Dashboard</h1>
          <p style={{ marginTop: 0, color: "var(--muted)" }}>Signed in as {user.email}</p>
        </div>
        <button className="button ghost" onClick={onLogout} type="button">
          Logout
        </button>
      </header>

      <section className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>{editingTaskId ? "Edit task" : "Add task"}</h2>
        <form onSubmit={handleSaveTask}>
          <label className="field">
            Title
            <input
              className="input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label className="field">
            Description
            <textarea
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <div className="row">
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingTaskId ? "Update task" : "Create task"}
            </button>
            {editingTaskId ? (
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setEditingTaskId(null);
                  setForm({ title: "", description: "" });
                }}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Search by title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="select"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as "ALL" | TaskStatus);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <button className="button ghost" type="button" onClick={() => void loadTasks(1)}>
            Apply filters
          </button>
        </div>

        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

        {loading ? (
          <p>Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No tasks found.</p>
        ) : (
          <div className="grid">
            {tasks.map((task) => (
              <article className="card task-item" key={task.id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{task.title}</strong>
                  <span className={`badge ${task.status === "COMPLETED" ? "done" : ""}`}>{task.status}</span>
                </div>

                {task.description ? <p style={{ margin: 0 }}>{task.description}</p> : null}

                <div className="task-meta">
                  <span>Created {new Date(task.createdAt).toLocaleString()}</span>
                </div>

                <div className="row">
                  <button className="button ghost" type="button" onClick={() => onToggle(task.id)}>
                    Toggle
                  </button>
                  <button className="button ghost" type="button" onClick={() => startEdit(task)}>
                    Edit
                  </button>
                  <button className="button danger" type="button" onClick={() => onDelete(task.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="row" style={{ marginTop: 16 }}>
          <button
            className="button ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => void loadTasks(page - 1)}
          >
            Previous
          </button>
          <span style={{ color: "var(--muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="button ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => void loadTasks(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
