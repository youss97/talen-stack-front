import * as yup from 'yup';
import { CURRENCIES } from '@/lib/currencies';

// Extraire tous les codes de devises valides
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
  current_salary: yup.number().nullable(),
  daily_rate: yup.number().nullable(),
  package_rate: yup.number().nullable(),
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
  availability_days: yup.number().when('availability_type', {
    is: 'less_than_one_month',
    then: (schema) => schema.required('Le nombre de jours est requis').min(1).max(30),
    otherwise: (schema) => schema.nullable(),
  }),
  availability_custom_value: yup.number().when('availability_type', {
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
  languages: yup.array().of(
    yup.object({
      language: yup.string().required(),
      level: yup.number().min(1).max(5).required(),
    })
  ),
  
  // Qualification
  qualification_report: yup.string().required('Le compte rendu de qualification est requis'),
  recruiter_notes: yup.string().nullable(),
  recruiter_interview_date: yup.string().nullable(),
  status: yup.string().required('Le statut est requis'),
  
  // Anonymisation et ajustements
  is_anonymized: yup.boolean(),
  adjusted_experience: yup.number().nullable().min(0),
});

export const updateRecruiterSchema = createRecruiterSchema.partial();

export type CreateRecruiterFormData = yup.InferType<typeof createRecruiterSchema>;
