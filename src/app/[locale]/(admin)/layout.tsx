"use client";

import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "@/i18n/navigation";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import AuthGuard from "@/components/auth/AuthGuard";
import PermissionGuard from "@/components/auth/PermissionGuard";
import InstallPWA from "@/components/pwa/InstallPWA";
import NotificationsSocket from "@/components/notifications/NotificationsSocket";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
    ? "ms-0"
    : isExpanded || isHovered
    ? "lg:ms-[290px]"
    : "lg:ms-[90px]";

  // Don't apply PermissionGuard to the root path (/) - it's just a redirect
  const isRootPath = pathname === "/";

  return (
    <AuthGuard>
      <NotificationsSocket />
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${mainContentMargin}`}
          style={{ background: "var(--bg)", minHeight: "100vh" }}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="w-full p-4 md:p-6 lg:p-8">
            <ErrorBoundary>
              {isRootPath ? (
                children
              ) : (
                <PermissionGuard>{children}</PermissionGuard>
              )}
            </ErrorBoundary>
          </div>
        </div>
        {/* PWA Install Component */}
        <InstallPWA />
      </div>
    </AuthGuard>
  );
}
