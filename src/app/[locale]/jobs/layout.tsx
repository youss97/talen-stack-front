import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  return {
    title: t("jobsMeta.title"),
    description: t("jobsMeta.description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: t("jobsMeta.title"),
    },
  };
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
