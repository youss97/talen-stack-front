"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface CustomField { type: string; label: string; value: string }
interface Card {
  id: string;
  full_name: string;
  position?: string;
  company_label?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  socials?: Record<string, string>;
  custom_fields?: CustomField[];
  branding?: Record<string, string>;
  company_name?: string;
  company_logo?: string;
  brand_color?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/* Thèmes type Linktree */
function getTheme(template: string, brand: string) {
  switch (template) {
    case "dark":
      return { page: "#18181b", text: "#ffffff", sub: "rgba(255,255,255,0.65)", btnBg: "rgba(255,255,255,0.10)", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.18)" };
    case "brand":
      return { page: brand, text: "#ffffff", sub: "rgba(255,255,255,0.8)", btnBg: "rgba(255,255,255,0.15)", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.3)" };
    case "gradient":
      return { page: `linear-gradient(160deg, ${brand}, ${shade(brand, -0.4)})`, text: "#ffffff", sub: "rgba(255,255,255,0.8)", btnBg: "rgba(255,255,255,0.15)", btnText: "#ffffff", btnBorder: "rgba(255,255,255,0.3)" };
    case "mint":
      return { page: `${brand}1a`, text: "#1f2937", sub: "#6b7280", btnBg: "#ffffff", btnText: "#1f2937", btnBorder: "#e5e7eb" };
    case "snow":
    default:
      return { page: "#f4f4f5", text: "#1f2937", sub: "#6b7280", btnBg: "#ffffff", btnText: "#1f2937", btnBorder: "#e5e7eb" };
  }
}
function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function PublicCardPage() {
  const t = useTranslations("public.card");
  const tRoot = useTranslations("public");
  const { uuid } = useParams() as { uuid: string };
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    fetch(`${API}/public/card/${uuid}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setCard)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  const src = (p?: string) => (p ? (p.startsWith("http") ? p : `${API}/${p}`) : "");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t("loading")}</div>;
  if (error || !card) return <div className="min-h-screen flex items-center justify-center text-red-500">{t("notFound")}</div>;

  const brand = card.brand_color || "#8AB925";
  const template = card.branding?.template || "snow";
  const theme = getTheme(template, brand);

  const socials = Object.entries(card.socials || {}).filter(([, v]) => v);
  const links = (card.custom_fields || []).filter((f) => f.type === "link" && f.value);
  const texts = (card.custom_fields || []).filter((f) => f.type === "text" && f.value);

  const btnStyle = { background: theme.btnBg, color: theme.btnText, border: `1px solid ${theme.btnBorder}` };

  const LinkButton = ({ href, label }: { href: string; label: string }) => (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
      className="block w-full text-center py-3.5 rounded-2xl text-sm font-semibold transition-transform hover:scale-[1.015] shadow-sm"
      style={btnStyle}>
      {label}
    </a>
  );

  return (
    <div className="min-h-screen flex justify-center" style={{ background: theme.page }}>
      <div className="w-full max-w-md px-6 pt-12 pb-16 flex flex-col items-center">
        {/* Avatar */}
        {card.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src(card.photo_url)} alt={card.full_name} className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-white/40" />
        ) : (
          <div className="h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white/40" style={{ background: brand }}>
            {card.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        )}

        {/* Identité */}
        <h1 className="mt-4 text-xl font-bold text-center" style={{ color: theme.text }}>{card.full_name}</h1>
        {card.position && <p className="mt-0.5 text-sm text-center" style={{ color: theme.sub }}>{card.position}</p>}

        {/* Société (logo + nom) */}
        {(card.company_logo || card.company_label || card.company_name) && (
          <div className="mt-3 flex items-center gap-2">
            {card.company_logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src(card.company_logo)} alt="" className="h-6 w-6 rounded object-contain bg-white p-0.5" />
            )}
            <span className="text-sm font-medium" style={{ color: theme.text }}>{card.company_label || card.company_name}</span>
          </div>
        )}

        {/* Textes libres */}
        {texts.length > 0 && (
          <div className="mt-3 text-center space-y-0.5">
            {texts.map((tx, i) => (
              <p key={i} className="text-sm" style={{ color: theme.sub }}>
                {tx.label ? <span className="font-medium" style={{ color: theme.text }}>{tx.label} : </span> : null}{tx.value}
              </p>
            ))}
          </div>
        )}

        {/* Boutons (style Linktree) */}
        <div className="mt-7 w-full space-y-3">
          {card.phone && <LinkButton href={`tel:${card.phone}`} label={t("call")} />}
          {card.email && <LinkButton href={`mailto:${card.email}`} label={t("email")} />}
          {socials.map(([k, v]) => <LinkButton key={k} href={v} label={k.charAt(0).toUpperCase() + k.slice(1)} />)}
          {links.map((l, i) => <LinkButton key={`l${i}`} href={l.value} label={l.label || t("link")} />)}
          <LinkButton href={`${API}/public/card/${uuid}/vcard`} label={t("addToContacts")} />
        </div>

        <p className="mt-10 text-xs" style={{ color: theme.sub }}>{tRoot("poweredBy")}</p>
      </div>
    </div>
  );
}
