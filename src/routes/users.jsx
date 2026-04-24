import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import TagBadge from "../components/TagBadge";

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
            <span>{user.username}</span>
            <div className="flex items-center gap-2">
              {user.banned ? <span className="text-red-300">banned</span> : null}
              <TagBadge tag={user.tag} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
