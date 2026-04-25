import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { apiGet } from "../lib/api";
import { TagList } from "../components/TagBadge";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiGet("/api/users").then((data) => setUsers(data.users || []));
  }, []);

  return (
    <section className="rounded border border-green-900/70 bg-black/40 p-4">
      <h1 className="mb-4 text-xl text-cyan-300">Users</h1>
      <div className="space-y-2 text-sm">
        {users.map((user) => (
          <div key={user.username} className="flex items-center justify-between rounded border border-green-900 p-2">
            <Link
              to="/users/$username"
              params={{ username: user.username }}
              className="text-cyan-300 transition hover:text-cyan-200"
            >
              {user.username}
            </Link>
            <div className="flex items-center gap-2">
              <TagList tags={user.roles} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
