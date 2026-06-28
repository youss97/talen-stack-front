// Ordre d'affichage des MODULES (groupes) de la sidebar — préférence utilisateur.
export const SIDEBAR_GROUP_KEY = "sidebar_group_order";
export const SIDEBAR_GROUP_EVENT = "sidebar-group-order-changed";

export function getSidebarGroupOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIDEBAR_GROUP_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setSidebarGroupOrder(order: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIDEBAR_GROUP_KEY, JSON.stringify(order));
  window.dispatchEvent(new Event(SIDEBAR_GROUP_EVENT));
}
