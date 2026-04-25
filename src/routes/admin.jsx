import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { apiGet, apiPost } from "../lib/api";
import { TagList } from "../components/TagBadge";
import { SELECTABLE_ROLES } from "../../shared/roles.js";

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [pastes, setPastes] = useState([]);
  const [tos, setTos] = useState("");
  const [feedback, setFeedback] = useState("");
  const adminKey = sessionStorage.getItem("adminKey") || "";

  const load = useCallback(async () => {
    const [a, u, p, t] = await Promise.all([
      apiPost("/api/admin/analytics", {}, adminKey),
      apiPost("/api/admin/users", {}, adminKey),
      apiPost("/api/admin/pastes", {}, adminKey),
      apiGet("/api/tos"),
    ]);
    setAnalytics(a.analytics);
    setUsers(u.users || []);
    setPastes(p.pastes);
    setTos(t.content);
  }, [adminKey]);

  useEffect(() => {
    load().catch(() => {
      window.location.href = "/";
    });
  }, [load]);

  const updateRoles = async (username, roles) => {
    if (!Array.isArray(roles) || roles.length === 0) {
      setFeedback("Keep at least one role");
      return;
    }
    try {
      await apiPost("/api/admin/users/update", { username, roles }, adminKey);
      setFeedback(`Updated ${username}`);
      await load();
    } catch (error) {
      setFeedback(error.message || "Failed to update user");
    }
  };

  const toggleRole = (username, role, currentRoles) => {
    const set = new Set(currentRoles);
    if (set.has(role)) {
      if (set.size === 1) {
        setFeedback("A user must keep at least one role");
        return;
      }
      set.delete(role);
    } else {
      set.add(role);
    }
    void updateRoles(username, Array.from(set));
  };

  const removeUser = async (username) => {
    if (!window.confirm(`Permanently remove ${username} and all of their pastes?`)) {
      return;
    }
    try {
      const result = await apiPost("/api/admin/users/remove", { username }, adminKey);
      setFeedback(result.message || `Removed ${username}`);
      await load();
    } catch (error) {
      setFeedback(error.message || "Failed to remove user");
    }
  };

  const deletePaste = async (id) => {
    try {
      const result = await apiPost("/api/admin/pastes/delete", { id }, adminKey);
      setFeedback(result.message || `Deleted paste ${id}`);
      await load();
    } catch (error) {
      setFeedback(error.message || "Failed to delete paste");
    }
  };

  const saveTos = async () => {
    await apiPost("/api/admin/tos", { content: tos }, adminKey);
  };

  return (
    <div className="space-y-5">
      <section className="rounded border border-red-700/50 bg-black/40 p-4">
        <h1 className="mb-3 text-xl text-red-300">Admin Panel</h1>
        {analytics ? (
          <div className="flex gap-4 text-sm">
            <span>Pastes: {analytics.pastes}</span>
            <span>Users: {analytics.users}</span>
          </div>
        ) : null}
        {feedback ? <p className="mt-2 text-xs text-cyan-300">{feedback}</p> : null}
      </section>

      <section className="rounded border border-green-900/70 bg-black/40 p-4">
        <h2 className="mb-3 text-cyan-300">Manage Users</h2>
        <p className="mb-3 text-xs text-zinc-500">Toggle roles; removal deletes the user and every paste they authored.</p>
        <div className="space-y-3 text-sm">
          {users.map((user) => (
            <div
              key={user.username}
              className="flex flex-col gap-2 rounded border border-green-900 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
            >
              <Link
                to="/users/$username"
                params={{ username: user.username }}
                className="min-w-36 font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                {user.username}
              </Link>
              <TagList tags={user.roles} />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {SELECTABLE_ROLES.map((role) => (
                  <label key={role} className="inline-flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="accent-cyan-500"
                      checked={user.roles?.includes(role)}
                      onChange={() => toggleRole(user.username, role, user.roles || [])}
                    />
                    {role}
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="rounded border border-red-600 px-2 py-1 text-left sm:ml-auto"
                onClick={() => removeUser(user.username)}
              >
                Remove user
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-green-900/70 bg-black/40 p-4">
        <h2 className="mb-3 text-cyan-300">Manage Pastes</h2>
        <div className="space-y-2 text-sm">
          {pastes.map((paste) => (
            <div key={paste.id} className="flex items-center justify-between rounded border border-green-900 p-2">
              <span>{paste.title || paste.id}</span>
              <button
                className="rounded border border-red-600 px-2 py-1"
                onClick={() => deletePaste(paste.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded border border-green-900/70 bg-black/40 p-4">
        <h2 className="mb-3 text-cyan-300">Edit TOS</h2>
        <textarea
          value={tos}
          onChange={(event) => setTos(event.target.value)}
          className="min-h-44 w-full rounded border border-green-900 bg-black p-2"
        />
        <button onClick={saveTos} className="mt-2 rounded border border-cyan-500 px-3 py-1 text-cyan-300">
          Save TOS
        </button>
      </section>
    </div>
  );
}
