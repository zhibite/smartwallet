import Link from "next/link";

const cards = [
  { href: "/settings/sync", label: "Sync Status", description: "View per-wallet sync health and lag." },
  { href: "/settings/users", label: "Users", description: "Create admin/viewer accounts." },
  { href: "/settings/tags", label: "Auto Tag Rules", description: "Edit rules used by tag engine." },
];

export default function SettingsIndex() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {cards.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-brand-500 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {c.label}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {c.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
