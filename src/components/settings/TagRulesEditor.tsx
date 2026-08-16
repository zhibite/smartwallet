"use client";
import { defaultAutoTagRules } from "@/lib/scoring/autoTags";

export default function TagRulesEditor() {
  return (
    <div className="space-y-4">
      <pre className="overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs dark:bg-zinc-900">
        {JSON.stringify(defaultAutoTagRules, null, 2)}
      </pre>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Edit <code>src/lib/scoring/autoTags.ts</code> to change thresholds.
      </p>
    </div>
  );
}
