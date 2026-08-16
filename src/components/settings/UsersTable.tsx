"use client";
import { useState } from "react";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

type User = {
  id: string;
  username: string;
  role: "ADMIN" | "VIEWER";
  displayName: string | null;
  enabled: boolean;
  createdAt: string;
};

export default function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "VIEWER" as "ADMIN" | "VIEWER",
    displayName: "",
  });

  async function create() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    if (!body.ok) {
      alert(body.error?.message ?? "Failed");
      return;
    }
    setCreating(false);
    setForm({ username: "", password: "", role: "VIEWER", displayName: "" });
    router.refresh();
  }

  async function toggleEnabled(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !u.enabled }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          New User
        </Button>
      </div>
      {creating && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              className="rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <input
              className="rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="display name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <select
              className="rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "ADMIN" | "VIEWER" })
              }
            >
              <option value="VIEWER">VIEWER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={create}>
              Create
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
            <tr>
              <th className="py-2">Username</th>
              <th className="py-2">Display</th>
              <th className="py-2">Role</th>
              <th className="py-2">Created</th>
              <th className="py-2">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                  No users.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-zinc-700">
                  <td className="py-3 font-mono text-xs">{u.username}</td>
                  <td className="py-3">{u.displayName ?? "—"}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-500">
                    {dayjs(u.createdAt).format("YYYY-MM-DD")}
                  </td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(u)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.enabled
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                          : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400"
                      }`}
                    >
                      {u.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
