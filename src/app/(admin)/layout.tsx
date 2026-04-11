"use client";

import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import AuthGuard from "@/components/auth/AuthGuard";
import PermissionGuard from "@/components/auth/PermissionGuard";
import InstallPWA from "@/components/pwa/InstallPWA";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // Don't apply PermissionGuard to the root path (/) - it's just a redirect
  const isRootPath = pathname === "/";

  return (
    <AuthGuard>
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            {isRootPath ? (
              children
            ) : (
              <PermissionGuard>{children}</PermissionGuard>
            )}
          </div>
        </div>
        {/* PWA Install Component */}
        <InstallPWA />
      </div>
    </AuthGuard>
  );
}
