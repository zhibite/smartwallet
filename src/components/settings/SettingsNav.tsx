"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const items = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/sync", label: "Sync Status" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/tags", label: "Auto Tag Rules" },
];

export default function SettingsNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <ul className="space-y-1">
        {items.map((i) => {
          const active = pathname === i.href;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-700"
                }`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
