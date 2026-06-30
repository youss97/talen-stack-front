import * as yup from 'yup';
import { CURRENCIES } from '@/lib/currencies';

const VALID_CURRENCY_CODES = CURRENCIES.map(currency => currency.code);

export const createRecruiterSchema = yup.object({
  request_id: yup.string().required('L\'offre est requise'),
  cv_id: yup.string().required('Le CV est requis'),

  // Workflow
  workflow_status: yup.string().oneOf(['draft', 'active', 'archived']).nullable(),

  // Situation actuelle
  currently_employed: yup.boolean(),
  current_contract_type: yup.string().required('Le type de contrat est requis'),

  // Rémunération
  current_salary: yup
    .number()
    .typeError('Veuillez saisir un montant valide')
    .nullable(),
  daily_rate: yup
    .number()
    .typeError('Veuillez saisir un montant valide')
    .nullable(),
  package_rate: yup
    .number()
    .typeError('Veuillez saisir un montant valide')
    .nullable(),
  salary_expectation: yup
    .number()
    .typeError('Veuillez saisir un montant valide')
    .nullable(),
  daily_rate_expectation: yup
    .number()
    .typeError('Veuillez saisir un montant valide')
    .nullable(),
  package_current: yup.string().nullable(),
  package_desired: yup.string().nullable(),
  currency: yup.string().oneOf(VALID_CURRENCY_CODES, 'Devise non valide'),

  // Type de contrat de l'offre
  offer_contract_types: yup.array().of(yup.string()),

  // Disponibilité
  availability_type: yup.string().required('La disponibilité est requise'),
  availability_reason: yup.string().when('availability_type', {
    is: 'immediate',
    then: (schema) => schema.required('La raison est requise pour une disponibilité immédiate'),
    otherwise: (schema) => schema.nullable(),
  }),
  availability_days: yup
    .number()
    .typeError('Veuillez saisir un nombre de jours valide')
    .when('availability_type', {
      is: 'less_than_one_month',
      then: (schema) => schema.required('Le nombre de jours est requis').min(1).max(30),
      otherwise: (schema) => schema.nullable(),
    }),
  availability_custom_value: yup
    .number()
    .typeError('Veuillez saisir une valeur valide')
    .when('availability_type', {
      is: 'other',
      then: (schema) => schema.required('La valeur est requise pour "Autres"').min(1),
      otherwise: (schema) => schema.nullable(),
    }),
  availability_custom_unit: yup.string().when('availability_type', {
    is: 'other',
    then: (schema) => schema.required('L\'unité est requise pour "Autres"').oneOf(['days', 'months']),
    otherwise: (schema) => schema.nullable(),
  }),
  availability_negotiable: yup.boolean(),

  // Langues
  languages: yup
    .array()
    // Ignore les lignes vides (langue non saisie) au lieu de bloquer la soumission
    .transform((value) =>
      Array.isArray(value)
        ? value.filter((l) => l && l.language && String(l.language).trim() !== "")
        : value
    )
    .of(
      yup.object({
        language: yup.string().required(),
        level: yup
          .number()
          .typeError('Veuillez saisir un niveau valide')
          .min(1)
          .max(5)
          .default(3),
      })
    ),

  // Qualification
  qualification_report: yup.string().required('Le compte rendu de qualification est requis'),
  recruiter_notes: yup.string().nullable(),
  recruiter_interview_date: yup.string().nullable(),
  // Statut non requis : une candidature enregistrée en brouillon prend "brouillon" par défaut côté backend
  status: yup.string().nullable(),

  // Anonymisation et ajustements
  is_anonymized: yup.boolean(),
  salary_confidential: yup.boolean(),
  adjusted_experience: yup
    .number()
    .typeError('Veuillez saisir un nombre d\'années valide')
    .nullable()
    .min(0),
});

export const updateRecruiterSchema = createRecruiterSchema.partial();

export type CreateRecruiterFormData = yup.InferType<typeof createRecruiterSchema>;
