import { useState } from "react";
import { apiPost } from "../lib/api";

const expirations = ["1h", "1d", "7d", "never"];

export default function CreatePage() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [expiration, setExpiration] = useState("1d");
  const [visibility, setVisibility] = useState("public");
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [message, setMessage] = useState("");

  const createPaste = async () => {
    try {
      const data = await apiPost("/api/pastes", {
        content,
        title,
        username,
        expiration,
        visibility,
        burnAfterRead,
      });
      window.location.href = `/paste/${data.paste.id}`;
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded border border-zinc-800 bg-black/40 p-4">
      <h1 className="mb-3 text-sm uppercase tracking-wider text-zinc-300">Create Paste</h1>
      <input
        className="mb-3 w-full rounded border border-zinc-800 bg-[#080909] p-2 text-sm outline-none focus:border-cyan-500"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Optional title"
      />
      <input
        className="mb-3 w-full rounded border border-zinc-800 bg-[#080909] p-2 text-sm outline-none focus:border-cyan-500"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Username (optional)"
      />
      <textarea
        className="min-h-64 w-full rounded border border-zinc-800 bg-[#080909] p-3 text-sm outline-none focus:border-cyan-500"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Paste text or code..."
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <select
          value={expiration}
          onChange={(event) => setExpiration(event.target.value)}
          className="rounded border border-zinc-800 bg-[#080909] p-2 outline-none focus:border-cyan-500"
        >
          {expirations.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="rounded border border-zinc-800 bg-[#080909] p-2 outline-none focus:border-cyan-500"
        >
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={burnAfterRead}
            onChange={(event) => setBurnAfterRead(event.target.checked)}
          />
          Burn after read
        </label>
        <button
          onClick={createPaste}
          className="rounded border border-cyan-500 px-4 py-2 text-cyan-300 transition hover:bg-cyan-500/10"
        >
          Create Paste
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-red-300">{message}</p> : null}
    </section>
  );
}
