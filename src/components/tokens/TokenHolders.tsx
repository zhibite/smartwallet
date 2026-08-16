import Link from "next/link";

type Holder = {
  wallet: string;
  label: string | null;
  amount: string;
  remainingAmount: string;
  costBasisUsd: string;
  acquiredAt: string;
};

export default function TokenHolders({ holders }: { holders: Holder[] }) {
  if (holders.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No smart money holders yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-zinc-700">
          <tr>
            <th className="py-2">Wallet</th>
            <th className="py-2">Remaining</th>
            <th className="py-2">Cost Basis</th>
            <th className="py-2">Since</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h) => (
            <tr
              key={h.wallet}
              className="border-b border-gray-100 dark:border-zinc-700"
            >
              <td className="py-3 font-mono text-xs">
                <Link
                  href={`/smart-money/${h.wallet}`}
                  className="text-brand-500 hover:text-brand-600"
                >
                  {h.label ?? `${h.wallet.slice(0, 6)}…${h.wallet.slice(-4)}`}
                </Link>
              </td>
              <td className="py-3">{Number(h.remainingAmount).toLocaleString()}</td>
              <td className="py-3">
                ${Number(h.costBasisUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 text-xs text-gray-500">
                {new Date(h.acquiredAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
