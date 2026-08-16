import { z } from "zod";
import { prisma } from "@/lib/db";
import { recordAudit, requireSession } from "@/lib/auth";
import { fail, json } from "@/lib/http";
import { isValidSolanaAddress } from "@/lib/solana/address";

const schema = z.object({
  addresses: z.array(z.string()).min(1).max(500),
});

export async function POST(req: Request) {
  const session = await requireSession();
  try {
    const body = schema.parse(await req.json());
    const valid = body.addresses.filter(isValidSolanaAddress);
    if (valid.length === 0) return fail("No valid addresses", 400);

    const created = await prisma.$transaction(
      valid.map((addr) =>
        prisma.wallet.upsert({
          where: { address: addr },
          create: { address: addr },
          update: {},
        }),
      ),
    );
    await recordAudit(session.uid, "wallet.import", undefined, {
      count: created.length,
    });
    return json({ imported: created.length });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(e.message, 400);
    return fail(e instanceof Error ? e.message : "Import failed", 500);
  }
}

export async function GET() {
  await requireSession();
  const wallets = await prisma.wallet.findMany({
    take: 200,
    orderBy: { firstSeenAt: "desc" },
    include: { metrics: true, manualTags: { include: { tag: true } } },
  });
  return json(wallets);
}
