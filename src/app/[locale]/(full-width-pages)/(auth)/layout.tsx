"use client";

import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import GuestGuard from "@/components/auth/GuestGuard";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ThreeParticles = dynamic(() => import("@/components/common/ThreeParticles"), { ssr: false });

const FEATURE_ICONS = ["🚀", "🤖", "🫥", "📊"];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("auth.marketing");
  const features = (t.raw("features") as Array<{ title: string; desc: string }>).map((f, i) => ({
    ...f,
    icon: FEATURE_ICONS[i],
  }));
  const stats = t.raw("stats") as Array<{ value: string; label: string }>;

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <GuestGuard>
          <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
            {children}

            {/* Decorated right panel */}
            <div className="lg:w-1/2 w-full h-full lg:flex flex-col items-center justify-center hidden relative overflow-hidden" style={{ background: "var(--rail)" }}>
              {/* Three.js particle background */}
              <ThreeParticles color="#8AB925" count={60} opacity={0.5} />

              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <GridShape />
              </div>

              {/* Radial glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(138,185,37,0.12) 0%, transparent 70%)" }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center px-12 max-w-md w-full">
                {/* Tagline */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                  className="text-2xl font-bold text-white text-center mb-3"
                >
                  {t("tagline")}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="text-brand-300 text-center text-sm mb-10 leading-relaxed"
                >
                  {t("subtitle")}
                </motion.p>

                {/* Feature list */}
                <div className="w-full space-y-4">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.35 + i * 0.1, ease: "easeOut" }}
                      className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                    >
                      <span className="text-2xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{f.title}</p>
                        <p className="text-brand-300/80 text-xs mt-0.5">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-10 flex items-center justify-around w-full border-t border-white/10 pt-8"
                >
                  {stats.map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl font-bold text-brand-400">{s.value}</div>
                      <div className="text-xs text-brand-300/70 mt-1">{s.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            <div className="fixed bottom-6 end-6 z-50 hidden sm:block">
              <ThemeTogglerTwo />
            </div>
          </div>
        </GuestGuard>
      </ThemeProvider>
    </div>
  );
}
