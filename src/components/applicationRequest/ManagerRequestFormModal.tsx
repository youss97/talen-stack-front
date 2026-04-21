"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";

interface ManagerRequestFormData {
  title: string;
  description: string;
  contract_type: string;
  location: string;
  country: string;
  work_type: "on_site" | "remote" | "hybrid";
  priority: "low" | "normal" | "high" | "urgent";
  min_experience?: number;
  max_experience?: number;
  number_of_profiles: number;
  required_skills: string[];
  languages: string[];
}

interface ManagerRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ManagerRequestFormData) => Promise<void>;
  isLoading?: boolean;
}

const CONTRACT_TYPES = ["CDI", "CDD", "Freelance", "Stage", "Alternance"];

const WORK_TYPES = [
  { value: "on_site", label: "Présentiel" },
  { value: "remote", label: "Télétravail" },
  { value: "hybrid", label: "Hybride" },
];

const PRIORITIES = [
  { value: "low", label: "Basse" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgent" },
];

const LANGUAGES = ["Français", "Anglais", "Arabe", "Espagnol", "Allemand", "Portugais"];

const COUNTRIES = [
  "Maroc",
  "France",
  "Algérie",
  "Tunisie",
  "Sénégal",
  "Côte d'Ivoire",
  "Cameroun",
  "Belgique",
  "Suisse",
  "Canada",
  "Espagne",
  "Italie",
  "Allemagne",
  "Portugal",
  "Pays-Bas",
  "Émirats arabes unis",
  "Qatar",
  "Arabie Saoudite",
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Maroc: [
    "Casablanca",
    "Rabat",
    "Marrakech",
    "Fès",
    "Tanger",
    "Agadir",
    "Meknès",
    "Oujda",
    "Kénitra",
    "Tétouan",
    "Safi",
    "Mohammedia",
    "El Jadida",
    "Beni Mellal",
    "Nador",
    "Settat",
    "Laâyoune",
    "Khouribga",
    "Berkane",
    "Taourirt",
    "Dakhla",
    "Errachidia",
    "Guelmim",
    "Khémisset",
    "Sidi Kacem",
    "Tiznit",
    "Taza",
    "Berrechid",
    "Ouarzazate",
    "Ifrane",
  ],
  France: [
    "Paris",
    "Lyon",
    "Marseille",
    "Toulouse",
    "Nice",
    "Nantes",
    "Bordeaux",
    "Lille",
    "Strasbourg",
    "Rennes",
    "Reims",
    "Grenoble",
    "Montpellier",
    "Dijon",
    "Angers",
  ],
  Algérie: [
    "Alger",
    "Oran",
    "Constantine",
    "Annaba",
    "Blida",
    "Batna",
    "Djelfa",
    "Sétif",
    "Sidi Bel Abbès",
    "Biskra",
  ],
  Tunisie: ["Tunis", "Sfax", "Sousse", "Monastir", "Bizerte", "Gabès", "Ariana", "Gafsa", "Kairouan"],
  Belgique: ["Bruxelles", "Anvers", "Gand", "Liège", "Bruges", "Namur"],
  Suisse: ["Genève", "Zurich", "Bâle", "Lausanne", "Berne"],
  Canada: ["Montréal", "Toronto", "Vancouver", "Calgary", "Ottawa", "Québec"],
  Espagne: ["Madrid", "Barcelone", "Valence", "Séville", "Bilbao", "Malaga"],
  Italie: ["Rome", "Milan", "Naples", "Turin", "Florence", "Bologne"],
  Allemagne: ["Berlin", "Munich", "Hambourg", "Francfort", "Cologne", "Stuttgart"],
  Portugal: ["Lisbonne", "Porto", "Braga", "Coimbra", "Faro"],
};

export default function ManagerRequestFormModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ManagerRequestFormModalProps) {
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["Français"]);
  const [selectedCountry, setSelectedCountry] = useState("Maroc");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ManagerRequestFormData>({
    defaultValues: {
      contract_type: "CDI",
      work_type: "on_site",
      priority: "normal",
      number_of_profiles: 1,
      country: "Maroc",
      location: "",
    },
  });

  const handleClose = () => {
    reset();
    setSkills([]);
    setSkillInput("");
    setSelectedLanguages(["Français"]);
    setSelectedCountry("Maroc");
    onClose();
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleFormSubmit = async (data: ManagerRequestFormData) => {
    if (skills.length === 0) return;
    await onSubmit({
      ...data,
      required_skills: skills,
      languages: selectedLanguages.length > 0 ? selectedLanguages : ["Français"],
    });
    handleClose();
  };

  const selectClass = `h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800`;

  const citiesForCountry = CITIES_BY_COUNTRY[selectedCountry] || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Nouvelle offre de recrutement</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Décrivez le profil que vous recherchez</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 custom-scrollbar">

          {/* Titre */}
          <div>
            <Label>Titre du poste <span className="text-error-500">*</span></Label>
            <Input
              placeholder="Ex: Développeur Full Stack React"
              {...register("title", { required: "Le titre est requis" })}
              error={!!errors.title}
            />
            {errors.title && <p className="mt-1 text-sm text-error-500">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <Label>Description <span className="text-error-500">*</span></Label>
            <TextArea
              placeholder="Décrivez le poste, les responsabilités, le profil recherché..."
              {...register("description", { required: "La description est requise" })}
              rows={4}
              error={!!errors.description}
            />
            {errors.description && <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>}
          </div>

          {/* Compétences requises */}
          <div>
            <Label>Compétences requises <span className="text-error-500">*</span></Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Ex: React, Node.js..."
                className="h-11 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
              <Button type="button" variant="outline" onClick={addSkill}>Ajouter</Button>
            </div>
            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-1 text-brand-500 hover:text-brand-700 text-base leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
            {skills.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Ajoutez au moins une compétence requise</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Type de contrat */}
            <div>
              <Label>Type de contrat <span className="text-error-500">*</span></Label>
              <select {...register("contract_type", { required: true })} className={selectClass}>
                {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Mode de travail */}
            <div>
              <Label>Mode de travail <span className="text-error-500">*</span></Label>
              <select {...register("work_type")} className={selectClass}>
                {WORK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Pays */}
            <div>
              <Label>Pays <span className="text-error-500">*</span></Label>
              <select
                {...register("country", { required: "Le pays est requis" })}
                className={selectClass}
                onChange={(e) => {
                  setValue("country", e.target.value);
                  setSelectedCountry(e.target.value);
                  setValue("location", "");
                }}
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.country && <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>}
            </div>

            {/* Ville */}
            <div>
              <Label>Ville <span className="text-error-500">*</span></Label>
              {citiesForCountry.length > 0 ? (
                <select
                  {...register("location", { required: "La ville est requise" })}
                  className={selectClass}
                >
                  <option value="">Sélectionnez une ville</option>
                  {citiesForCountry.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Nom de la ville"
                  {...register("location", { required: "La ville est requise" })}
                  error={!!errors.location}
                />
              )}
              {errors.location && <p className="mt-1 text-sm text-error-500">{errors.location.message}</p>}
            </div>

            {/* Expérience min */}
            <div>
              <Label>Expérience min (années)</Label>
              <Input
                type="number"
                placeholder="0"
                {...register("min_experience", { valueAsNumber: true, min: 0 })}
              />
            </div>

            {/* Expérience max */}
            <div>
              <Label>Expérience max (années)</Label>
              <Input
                type="number"
                placeholder="10"
                {...register("max_experience", { valueAsNumber: true, min: 0 })}
              />
            </div>

            {/* Priorité */}
            <div>
              <Label>Priorité</Label>
              <select {...register("priority")} className={selectClass}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Nombre de profils */}
            <div>
              <Label>Nombre de profils <span className="text-error-500">*</span></Label>
              <Input
                type="number"
                placeholder="1"
                {...register("number_of_profiles", { required: true, valueAsNumber: true, min: 1 })}
                error={!!errors.number_of_profiles}
              />
            </div>
          </div>

          {/* Langues */}
          <div>
            <Label>Langues requises</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedLanguages.includes(lang)
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading || skills.length === 0}>
            {isLoading ? "Enregistrement..." : "Créer l'offre"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
