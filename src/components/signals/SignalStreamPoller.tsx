"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignalStreamPoller() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <span className="text-xs text-gray-400">Auto-refresh every 30s</span>
  );
}
