const styles = {
  Known: "border-blue-500 text-blue-300",
  Vip: "border-yellow-500 text-yellow-300",
  Admin: "border-purple-500 text-purple-300",
  Owner: "tag-owner-rainbow border-transparent",
  User: "border-zinc-500 text-zinc-300",
  known: "border-red-500 text-red-300",
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
