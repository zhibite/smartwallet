"use client";
import { useState } from "react";
import Button from "@/components/ui/button/Button";

type Token = {
  mint: string;
  symbol: string | null;
  name: string | null;
  smartHolders: number | null;
  mcapUsd: string | null;
  liquidityUsd: string | null;
  riskScore: number | null;
};

export default function FollowWatchlist({ tokens }: { tokens: Token[] }) {
  const [busy, setBusy] = useState(false);

  function exportJson() {
    const data = tokens.map((t) => ({
      mint: t.mint,
      symbol: t.symbol,
      name: t.name,
      smartHolders: t.smartHolders,
      mcapUsd: t.mcapUsd,
      liquidityUsd: t.liquidityUsd,
      riskScore: t.riskScore,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "follow-watchlist.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const header = ["mint", "symbol", "name", "smartHolders", "mcapUsd", "liquidityUsd", "riskScore"];
    const rows = tokens.map((t) =>
      [t.mint, t.symbol ?? "", t.name ?? "", t.smartHolders ?? "", t.mcapUsd ?? "", t.liquidityUsd ?? "", t.riskScore ?? ""].join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "follow-watchlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function pushWebhook() {
    const url = window.prompt("Webhook URL?");
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch("/api/follow-output/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, tokens }),
      });
      const body = await res.json();
      if (!body.ok) {
        alert(body.error?.message ?? "Push failed");
      } else {
        alert(`Pushed ${body.data.pushed} tokens.`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
        <Button size="sm" variant="outline" onClick={exportJson}>
          Export JSON
        </Button>
        <Button size="sm" onClick={pushWebhook} disabled={busy}>
          {busy ? "Pushing..." : "Push Webhook"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3">Token</th>
              <th className="px-6 py-3">Smart Holders</th>
              <th className="px-6 py-3">MCap</th>
              <th className="px-6 py-3">Liquidity</th>
              <th className="px-6 py-3">Risk</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Watchlist is empty. Need at least 2 smart holders per token.
                </td>
              </tr>
            ) : (
              tokens.map((t) => (
                <tr
                  key={t.mint}
                  className="border-b border-gray-100 dark:border-zinc-700"
                >
                  <td className="px-6 py-4 font-mono text-xs">{t.symbol ?? t.mint.slice(0, 6) + "…"}</td>
                  <td className="px-6 py-4">{t.smartHolders ?? 0}</td>
                  <td className="px-6 py-4">
                    {t.mcapUsd ? `$${Number(t.mcapUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {t.liquidityUsd ? `$${Number(t.liquidityUsd).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </td>
                  <td className="px-6 py-4">{t.riskScore ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
