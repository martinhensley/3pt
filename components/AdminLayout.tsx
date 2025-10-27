"use client";

import { ReactNode } from "react";
import AdminHeader from "@/components/AdminHeader";

interface AdminLayoutProps {
  children: ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "1600px";
}

export default function AdminLayout({ children, maxWidth = "7xl" }: AdminLayoutProps) {
  const maxWidthClass = maxWidth === "1600px"
    ? "max-w-[1600px]"
    : `max-w-${maxWidth}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${maxWidthClass} mx-auto px-4 pt-6`}>
        <AdminHeader />
      </div>

      <div className={`${maxWidthClass} mx-auto px-4 py-8`}>
        {children}
      </div>
    </div>
  );
}
