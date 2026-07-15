import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public" });
  return {
    title: t("applyMeta.title"),
    description: t("applyMeta.description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: t("applyMeta.title"),
    },
  };
}

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
