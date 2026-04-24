import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { apiGet } from "../lib/api";
import TagBadge from "../components/TagBadge";

export default function PastePage() {
  const { pasteId } = useParams({ from: "/paste/$pasteId" });
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/api/pastes/${pasteId}`)
      .then((data) => setPaste(data.paste))
      .catch((err) => setError(err.message));
  }, [pasteId]);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!paste) return <p>Loading...</p>;

  return (
    <section className="rounded border border-green-900/70 bg-black/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl text-cyan-300">{paste.title || paste.id}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-green-300/80">
            <span>{paste.username || "anonymous"}</span>
            <TagBadge tag={paste.tag || "User"} />
          </div>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(paste.content)}
          className="rounded border border-cyan-500 px-3 py-1 text-cyan-300"
        >
          Copy
        </button>
      </div>
      <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
        {paste.content}
      </SyntaxHighlighter>
    </section>
  );
}
