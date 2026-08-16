"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import React from "react";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isMobileOpen, isInitialized } = useSidebar();

  if (!isInitialized) return null;

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded
      ? "lg:ml-[240px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex bg-white dark:bg-zinc-900">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} bg-white dark:bg-zinc-900`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 bg-white dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
