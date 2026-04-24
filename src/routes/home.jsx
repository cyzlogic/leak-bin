import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { apiGet } from "../lib/api";
import TagBadge from "../components/TagBadge";

export default function HomePage() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    apiGet("/api/pastes/recent").then((data) => setRecent(data.pastes || []));
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="rounded border border-zinc-800 bg-black/50 p-4 text-center">
        <h1 className="mb-2 text-xl tracking-wide text-zinc-200">leak.bin</h1>
        <pre className="mx-auto mb-2 inline-block overflow-x-auto text-left text-[12px] leading-tight text-cyan-300">
{`  _            _      _     _       
 | |          | |    | |   (_)      
 | | ___  __ _| | __ | |__  _ _ __  
 | |/ _ \\/ _\` | |/ / | '_ \\| | '_ \\ 
 | |  __/ (_| |   < _| |_) | | | | |
 |_|\\___|\\__,_|_|\\_(_)_.__/|_|_| |_|
                                    
                                    `}
        </pre>
        <p className="text-xs text-zinc-400">Anonymous drop zone</p>
        <Link
          to="/create"
          className="mt-3 inline-block rounded border border-cyan-500 px-3 py-1 text-xs text-cyan-300 transition hover:bg-cyan-500/10"
        >
          Go to Create Paste
        </Link>
      </section>

      <section className="rounded border border-zinc-800 bg-black/40 p-4">
        <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-300">Recent Public Pastes</h2>
        <div className="space-y-2 text-sm">
          {recent.map((paste) => (
            <div key={paste.id} className="flex items-center justify-between gap-3 rounded border border-zinc-900 bg-black/30 px-3 py-2">
              <Link
                to="/paste/$pasteId"
                params={{ pasteId: paste.id }}
                className="truncate text-cyan-300 transition hover:text-cyan-200"
              >
                {paste.title || paste.id}
              </Link>
              <div className="flex items-center gap-2">
                <span>{paste.username || "anonymous"}</span>
                <TagBadge tag={paste.tag || "User"} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
