"use client";
import dynamic from "next/dynamic";
import dayjs from "dayjs";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type Point = { ts: string; priceUsd: string | null; mcapUsd: string | null; liquidityUsd: string | null };

export default function TokenKlineChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No price snapshots yet.
      </p>
    );
  }
  const ohlc = points.map((p) => [dayjs(p.ts).format("YYYY-MM-DD HH:mm"), Number(p.priceUsd ?? 0)]);
  const option = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: { type: "time" as const },
    yAxis: { type: "value" as const, scale: true },
    series: [{ type: "line" as const, smooth: true, data: ohlc, areaStyle: { opacity: 0.15 } }],
  };
  return <ReactECharts option={option} style={{ height: 320 }} />;
}
