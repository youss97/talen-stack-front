import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const NAMESPACES = [
  "common",
  "layout",
  "auth",
  "agenda",
  "applications",
  "assignments",
  "assignModal",
  "businessCards",
  "clients",
  "companies",
  "cvs",
  "dashboard",
  "emails",
  "integrations",
  "interviewModals",
  "landing",
  "logs",
  "managers",
  "myRequests",
  "notifications",
  "profile",
  "public",
  "publicOffers",
  "recruiterModals",
  "recruitmentRequests",
  "roles",
  "settings",
  "statistics",
  "subscriptions",
  "users",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const modules = await Promise.all(
    NAMESPACES.map((ns) => import(`./messages/${locale}/${ns}.json`)),
  );

  const messages = NAMESPACES.reduce<Record<string, unknown>>((acc, ns, i) => {
    acc[ns] = modules[i].default;
    return acc;
  }, {});

  return { locale, messages };
});
