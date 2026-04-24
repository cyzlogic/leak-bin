import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";

export default function TosPage() {
  const [tos, setTos] = useState("Loading...");

  useEffect(() => {
    apiGet("/api/tos").then((data) => setTos(data.content || ""));
  }, []);

  return (
    <section className="rounded border border-green-900/70 bg-black/40 p-4">
      <h1 className="mb-4 text-xl text-cyan-300">Terms of Service</h1>
      <pre className="whitespace-pre-wrap text-sm text-green-100/90">{tos}</pre>
    </section>
  );
}
