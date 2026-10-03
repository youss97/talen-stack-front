// Construit le texte à coller dans un assistant IA (ChatGPT, etc.) pour obtenir un score de
// qualification du candidat par rapport au poste. Solution provisoire, en attendant un scoring
// intégré à l'application.

const stripHtml = (html?: string | null) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

type Item = Record<string, unknown>;

const line = (label: string, value: unknown) =>
  value != null && String(value).trim() !== "" ? `${label} : ${String(value).trim()}` : null;

export function buildCandidateScorePrompt(recruiter: any): string {
  const cv: Item = recruiter?.cv || {};
  const req: Item = recruiter?.request || {};
  const name = `${cv.candidate_first_name || ""} ${cv.candidate_last_name || ""}`.trim();

  const experiences = Array.isArray(cv.experiences) ? (cv.experiences as Item[]) : [];
  const formations = Array.isArray(cv.formations) ? (cv.formations as Item[]) : [];
  const skills = Array.isArray(cv.skills) ? (cv.skills as unknown[]).map(String) : [];
  const languages = Array.isArray(cv.languages) ? (cv.languages as unknown[]).map(String) : [];

  const expLines = experiences.map((e) =>
    `- ${[e.title, e.company, e.location].filter(Boolean).join(" — ")} (${[e.start_date, e.end_date].filter(Boolean).join(" → ")})${e.description ? `\n  ${stripHtml(String(e.description))}` : ""}`,
  );
  const formLines = formations.map((f) =>
    `- ${[f.degree, f.field, f.institution].filter(Boolean).join(" — ")} (${[f.start_date, f.end_date].filter(Boolean).join(" → ")})`,
  );

  const parts = [
    "# Candidature",
    line("Nom", name),
    line("Poste visé", req.title),
    line("Référence", req.reference),
    line("Expérience (ans)", recruiter?.adjusted_experience ?? cv.total_experience),
    line("Localisation", cv.location),
    "",
    "# Descriptif du poste",
    stripHtml(req.description as string) || "(non renseigné)",
    "",
    "# CV du candidat",
    line("Titre / dernier poste", cv.profile_title || cv.last_position),
    line("Résumé", stripHtml(cv.summary as string)),
    skills.length ? `Compétences : ${skills.join(", ")}` : null,
    languages.length ? `Langues : ${languages.join(", ")}` : null,
    expLines.length ? `Expériences :\n${expLines.join("\n")}` : null,
    formLines.length ? `Formations :\n${formLines.join("\n")}` : null,
    "",
    "# Consigne",
    "Tu es un recruteur expérimenté. À partir du descriptif du poste et du CV ci-dessus, évalue l'adéquation du candidat sur 100 (un entier), puis justifie en 5 points maximum (points forts, points faibles, écarts avec le poste, risques, recommandation). Réponds en français et termine par une ligne « Score : X/100 ».",
  ];

  return parts.filter((p) => p !== null).join("\n");
}
