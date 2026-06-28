"use client";
import { useState } from "react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ContactInfo { email?: string; phone?: string; address?: string; linkedin?: string; instagram?: string }

export default function Contact({ contact, brand = "var(--color-brand-500)" }: { contact?: ContactInfo; brand?: string }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const c = contact || {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const r = await fetch(`${API}/public/landing/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch { /* */ } finally { setSending(false); }
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="landing-container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Contactez-nous</h2>
          <p className="text-xl text-gray-600">Une question ou une demande de démo ? Écrivez-nous.</p>
        </motion.div>

        {sent ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-green-700">Merci ! Votre message a bien été envoyé.</div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" className="h-11 rounded-xl border border-gray-200 px-4 text-sm" />
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="h-11 rounded-xl border border-gray-200 px-4 text-sm" />
            </div>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Sujet" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm" />
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Votre message" rows={4} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm" />
            <button type="submit" disabled={sending} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: brand }}>
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        )}

        {(c.email || c.phone || c.address || c.linkedin || c.instagram) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            {c.email && <span>✉ {c.email}</span>}
            {c.phone && <span>☎ {c.phone}</span>}
            {c.address && <span>📍 {c.address}</span>}
            {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-100">LinkedIn</a>}
            {c.instagram && <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-100">Instagram</a>}
          </div>
        )}
      </div>
    </section>
  );
}
