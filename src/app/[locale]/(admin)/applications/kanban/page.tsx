"use client";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

// Le Kanban est désormais une vue de la page Candidatures (mêmes filtres et mêmes actions) :
// on garde cette URL pour les anciens liens et raccourcis.
export default function ApplicationsKanbanRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/applications?view=kanban");
  }, [router]);
  return null;
}
