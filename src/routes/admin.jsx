import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import TagBadge from "../components/TagBadge";

const tags = ["Known", "Vip", "Admin", "Owner", "User", "known"];
const normalizeTag = (value) => {
  if (tags.includes(value)) return value;
  const lowered = String(value || "").toLowerCase();
  if (lowered === "user") return "User";
  if (lowered === "admin") return "Admin";
  if (lowered === "vip") return "Vip";
  if (lowered === "owner") return "Owner";
  return "User";
};

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
    setUsers((u.users || []).map((user) => ({ ...user, tag: normalizeTag(user.tag) })));
    setPastes(p.pastes);
    setTos(t.content);
  }, [adminKey]);

  useEffect(() => {
    load().catch(() => {
      window.location.href = "/";
    });
  }, [load]);

  const updateUser = async (username, tag, banned) => {
    try {
      await apiPost(
        "/api/admin/users/update",
        { username, tag: normalizeTag(tag), banned: Boolean(banned) },
        adminKey,
      );
      setFeedback(`Updated ${username}`);
      await load();
    } catch (error) {
      setFeedback(error.message || "Failed to update user");
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
        <div className="space-y-2 text-sm">
          {users.map((user) => (
            <div key={user.username} className="flex flex-wrap items-center gap-2 rounded border border-green-900 p-2">
              <span className="min-w-36">{user.username}</span>
              <TagBadge tag={user.tag} />
              <select
                value={user.tag}
                className="rounded border border-green-900 bg-black px-2 py-1"
                onChange={(event) => updateUser(user.username, event.target.value, user.banned)}
              >
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <button
                className="rounded border border-red-600 px-2 py-1"
                onClick={() => updateUser(user.username, user.tag, !user.banned)}
              >
                {user.banned ? "Unban" : "Ban"}
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
