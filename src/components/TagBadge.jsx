const styles = {
  Known: "border-blue-500 text-blue-300",
  Vip: "border-yellow-500 text-yellow-300",
  Admin: "border-purple-500 text-purple-300",
  Owner: "tag-owner-rainbow border-transparent",
  User: "border-zinc-500 text-zinc-300",
  known: "border-red-500 text-red-300",
  OG: "border-amber-500 text-amber-200",
  COMBOSS: "border-rose-500 text-rose-200",
  RUNNERUP: "border-slate-400 text-slate-200",
};

export default function TagBadge({ tag }) {
  const label = tag || "User";
  const style = styles[label] || "border-zinc-500 text-zinc-300";
  return (
    <span className={`rounded border px-2 py-0.5 text-xs ${style}`}>
      {label}
    </span>
  );
}

export function TagList({ tags }) {
  const list = Array.isArray(tags) && tags.length ? tags : ["User"];
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1">
      {list.map((t, i) => (
        <TagBadge key={`${t}-${i}`} tag={t} />
      ))}
    </span>
  );
}
