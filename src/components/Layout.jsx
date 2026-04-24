import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export default function Layout() {
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const sequenceRef = useRef({ step: 0, at: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const now = Date.now();

      if (event.shiftKey && key === "j") {
        sequenceRef.current = { step: 1, at: now };
        return;
      }

      if (
        event.shiftKey &&
        key === "k" &&
        sequenceRef.current.step === 1 &&
        now - sequenceRef.current.at < 1800
      ) {
        setShowAdminPrompt(true);
        sequenceRef.current = { step: 0, at: 0 };
        return;
      }

      sequenceRef.current = { step: 0, at: 0 };
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#050607] text-green-100">
      <nav className="border-b border-zinc-800/90 bg-black/60">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4">
          <div className="text-sm font-semibold tracking-wide text-zinc-200">leak.bin</div>
          <div className="flex gap-6 text-xs text-zinc-400">
            <Link to="/" className="transition hover:text-cyan-300 [&.active]:text-cyan-300">
            Home
          </Link>
            <Link to="/create" className="transition hover:text-cyan-300 [&.active]:text-cyan-300">
            Create
          </Link>
            <Link to="/users" className="transition hover:text-cyan-300 [&.active]:text-cyan-300">
            Users
          </Link>
            <Link to="/tos" className="transition hover:text-cyan-300 [&.active]:text-cyan-300">
            TOS
          </Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      {showAdminPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            className="w-full max-w-md rounded border border-cyan-800/70 bg-zinc-950 p-4 shadow-[0_0_28px_rgba(56,189,248,0.18)]"
            onSubmit={(event) => {
              event.preventDefault();
              sessionStorage.setItem("adminKey", adminKey);
              setShowAdminPrompt(false);
              navigate({ to: "/admin" });
            }}
          >
            <p className="mb-2 text-sm text-cyan-300">Admin Access (Shift+J, Shift+K)</p>
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              type="password"
              className="w-full rounded border border-zinc-700 bg-black p-2 outline-none focus:border-cyan-500"
              placeholder="Enter admin key"
            />
            <div className="mt-3 flex gap-2">
              <button className="rounded border border-cyan-500 px-3 py-1 text-cyan-300 transition hover:bg-cyan-500/10">
                Unlock
              </button>
              <button
                type="button"
                onClick={() => setShowAdminPrompt(false)}
                className="rounded border border-zinc-600 px-3 py-1 text-zinc-200 transition hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
