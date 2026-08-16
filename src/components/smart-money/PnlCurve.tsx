"use client";
import dynamic from "next/dynamic";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import dayjs from "dayjs";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type Point = { ts: string; pnlUsd: number };

export default function PnlCurve({ walletAddress }: { walletAddress: string }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wallets/${walletAddress}/pnl-curve`)
      .then((r) => r.json())
      .then((body: { ok: boolean; data?: Point[] }) => {
        if (body.ok && body.data) setPoints(body.data);
      })
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }
  if (points.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No PnL history yet. Daily PnL will populate after the first scheduled recompute.
      </p>
    );
  }

  const option = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: points.map((p) => dayjs(p.ts).format("MM-DD")),
    },
    yAxis: { type: "value" as const },
    series: [
      {
        type: "line" as const,
        smooth: true,
        data: points.map((p) => p.pnlUsd),
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} />;
}
