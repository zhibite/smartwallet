"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";

type SavedQuery = {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  criteria: unknown;
};

export default function QueryBuilder() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"wallet" | "token">("wallet");
  const [criteria, setCriteria] = useState(
    '{\n  "winRate": { "min": 0.6 }\n}',
  );

  async function load() {
    const res = await fetch("/api/queries");
    const body = await res.json();
    if (body.ok) setQueries(body.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(criteria);
    } catch {
      alert("Invalid JSON");
      return;
    }
    const res = await fetch("/api/queries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scope, criteria: parsed }),
    });
    const body = await res.json();
    if (!body.ok) {
      alert(body.error?.message ?? "Save failed");
      return;
    }
    setName("");
    await load();
  }

  async function run(id: string) {
    const res = await fetch(`/api/queries/${id}/run`);
    const body = await res.json();
    if (!body.ok) {
      alert(body.error?.message ?? "Run failed");
      return;
    }
    alert(`Found ${body.data.count} results.`);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/queries/${id}`, { method: "DELETE" });
    const body = await res.json();
    if (body.ok) load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          New Query
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">
              Name
            </label>
            <input
              className="w-full rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">
              Scope
            </label>
            <select
              className="rounded-lg border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={scope}
              onChange={(e) => setScope(e.target.value as "wallet" | "token")}
            >
              <option value="wallet">Wallet</option>
              <option value="token">Token</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-500 dark:text-gray-400">
              Criteria (JSON)
            </label>
            <textarea
              className="h-32 w-full rounded-lg border border-gray-200 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
          </div>
          <Button onClick={save} disabled={!name}>
            Save Query
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Saved Queries
        </h2>
        {queries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No saved queries yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-700">
            {queries.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {q.name}{" "}
                    <span className="ml-2 text-xs text-gray-400">
                      {q.scope}
                    </span>
                  </p>
                  {q.description && (
                    <p className="text-xs text-gray-500">{q.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => run(q.id)}>
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove(q.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
