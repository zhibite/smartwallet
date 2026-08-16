import { prisma } from "@/lib/db";
import SignalsTable from "@/components/signals/SignalsTable";
import SignalStreamPoller from "@/components/signals/SignalStreamPoller";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const signals = await prisma.signal.findMany({
    orderBy: { detectedAt: "desc" },
    take: 100,
    include: { token: true },
  });
  const rows = signals.map((s) => ({
    id: s.id,
    type: s.type,
    tokenMint: s.tokenMint,
    tokenSymbol: s.token.symbol,
    tokenName: s.token.name,
    strength: s.strength,
    detectedAt: s.detectedAt.toISOString(),
    windowStart: s.windowStart.toISOString(),
    windowEnd: s.windowEnd.toISOString(),
    dispatched: s.dispatched,
  }));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Signal Center
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consensus buys, group sells, and other actionable events.
          </p>
        </div>
        <SignalStreamPoller />
      </div>
      <SignalsTable signals={rows} />
    </div>
  );
}
