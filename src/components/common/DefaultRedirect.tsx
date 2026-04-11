"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppSelector } from "@/lib/hooks";

export default function DefaultRedirect() {
  const router = useRouter();
  const { allowedPaths } = usePermissions();
  const { permissionsReady } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (permissionsReady) {
      const firstPath = allowedPaths[0] || "/access-denied";
      router.replace(firstPath);
    }
  }, [permissionsReady, allowedPaths, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Redirection...
        </p>
      </div>
    </div>
  );
}
