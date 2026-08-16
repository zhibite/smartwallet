"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { isValidSolanaAddress } from "@/lib/solana/address";

export default function ImportWalletButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const addresses = text
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const invalid = addresses.filter((a) => !isValidSolanaAddress(a));
    if (invalid.length > 0) {
      setError(`Invalid addresses: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`);
      return;
    }
    if (addresses.length === 0) {
      setError("Paste at least one address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresses }),
        credentials: "include",
      });
      const body = await res.json();
      if (!body.ok) throw new Error(body.error?.message ?? "Import failed");
      setOpen(false);
      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Import Wallets
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Import Wallets
            </h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Paste addresses separated by comma, space, or newline.
            </p>
            <textarea
              className="h-40 w-full rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              placeholder="So1anaAddr1...&#10;So1anaAddr2..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <p className="mt-2 text-sm text-error-500">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submit} disabled={submitting}>
                {submitting ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
