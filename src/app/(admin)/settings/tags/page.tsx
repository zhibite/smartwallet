import TagRulesEditor from "@/components/settings/TagRulesEditor";

export default function SettingsTagsPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Auto Tag Rules
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Default rules below. Edit JSON to override thresholds; worker re-runs daily at 05:00 UTC.
      </p>
      <TagRulesEditor />
    </div>
  );
}
