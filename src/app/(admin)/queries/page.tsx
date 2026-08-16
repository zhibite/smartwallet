import QueryBuilder from "@/components/queries/QueryBuilder";

export default function QueriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Query Builder
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Filter smart money wallets and tokens using any combination of rules.
        </p>
      </div>
      <QueryBuilder />
    </div>
  );
}
