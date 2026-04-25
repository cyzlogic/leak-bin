import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { TagList } from "../components/TagBadge";

export default function UserProfilePage() {
  const { username } = useParams({ from: "/users/$username" });
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setUser(null);
    apiGet(`/api/users/${encodeURIComponent(username)}`)
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message || "Failed to load profile"));
  }, [username]);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <section className="space-y-4 rounded border border-green-900/70 bg-black/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl text-cyan-300">{user.username}</h1>
          <p className="text-xs text-zinc-500">Joined: {new Date(user.createdAt).toLocaleString()}</p>
        </div>
        <TagList tags={user.roles} />
      </div>

      <div className="rounded border border-zinc-800 bg-black/40 p-3 text-sm">
        <span className="text-zinc-400">Total pastes: </span>
        <span className="text-cyan-300">{user.totalPastes}</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm uppercase tracking-wider text-zinc-300">Recent Pastes</h2>
        {user.recentPastes.length === 0 ? (
          <p className="text-sm text-zinc-500">No pastes yet.</p>
        ) : (
          user.recentPastes.map((paste) => (
            <div
              key={paste.id}
              className="flex items-center justify-between rounded border border-zinc-900 bg-black/30 px-3 py-2 text-sm"
            >
              <Link
                to="/paste/$pasteId"
                params={{ pasteId: paste.id }}
                className="truncate text-cyan-300 transition hover:text-cyan-200"
              >
                {paste.title || paste.id}
              </Link>
              <span className="text-xs text-zinc-500">{new Date(paste.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
