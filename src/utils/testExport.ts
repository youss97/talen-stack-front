/**
 * Script de test pour les fonctions d'export Excel
 * Ce fichier peut être utilisé pour tester manuellement les exports
 */

import { exportApplicationRequestsToExcel, exportCandidaturesToExcel, type ExportableCandidate } from './excelExport';
import type { ApplicationRequest } from '@/types/applicationRequest';

// Données de test pour les demandes de recrutement
const testApplicationRequests: ApplicationRequest[] = [
  {
    id: '1',
    reference: 'REF-2026-001',
    title: 'Développeur Full Stack Senior',
    description: 'Nous recherchons un développeur expérimenté pour rejoindre notre équipe',
    client: { id: '1', name: 'TechCorp Solutions' },
    manager: { id: '1', first_name: 'Jean', last_name: 'Dupuis' },
    status: 'open',
    priority: 'high',
    contract_type: 'CDI',
    location: 'Paris 8ème',
    country: 'France',
    work_type: 'full_time',
    remote_possible: true,
    remote_days_per_week: 3,
    required_skills: 'React, Node.js, TypeScript, PostgreSQL, Docker',
    min_experience: 5,
    max_experience: 10,
    min_salary: 55000,
    max_salary: 75000,
    daily_rate_min: null,
    daily_rate_max: null,
    mission_duration_months: null,
    mission_renewable: false,
    languages: 'Français courant, Anglais technique',
    benefits: 'Tickets restaurant, mutuelle, RTT',
    bonuses: 'Prime annuelle sur objectifs',
    variables: 'Intéressement et participation',
    number_of_profiles: 2,
    desired_start_date: '2026-05-01',
    created_at: '2026-03-10T08:30:00Z',
    updated_at: '2026-03-10T14:15:00Z',
  },
  {
    id: '2',
    reference: 'REF-2026-002',
    title: 'Chef de Projet Digital',
    description: 'Pilotage de projets digitaux innovants',
    client: { id: '2', name: 'Digital Innovations' },
    manager: { id: '2', first_name: 'Marie', last_name: 'Martin' },
    status: 'in_progress',
    priority: 'medium',
    contract_type: 'CDD',
    location: 'Lyon',
    country: 'France',
    work_type: 'full_time',
    remote_possible: false,
    remote_days_per_week: 0,
    required_skills: 'Gestion de projet, Agile, Scrum, Leadership',
    min_experience: 3,
    max_experience: 8,
    min_salary: 45000,
    max_salary: 60000,
    daily_rate_min: null,
    daily_rate_max: null,
    mission_duration_months: 12,
    mission_renewable: true,
    languages: 'Français, Anglais',
    benefits: 'Mutuelle, CE',
    bonuses: 'Prime de performance',
    variables: 'Bonus projet',
    number_of_profiles: 1,
    desired_start_date: '2026-04-15',
    created_at: '2026-03-09T10:00:00Z',
    updated_at: '2026-03-10T16:30:00Z',
  }
] as ApplicationRequest[];

// Données de test pour les candidatures
const testCandidates: ExportableCandidate[] = [
  {
    id: '1',
    cv: {
      candidate_first_name: 'Sophie',
      candidate_last_name: 'Bernard',
      candidate_email: 'sophie.bernard@email.com',
      file_name: 'CV_Sophie_Bernard_2026.pdf'
    },
    request: {
      title: 'Développeur Full Stack Senior',
      reference: 'REF-2026-001',
      client: { name: 'TechCorp Solutions' }
    },
    status: 'interview',
    proposed_at: '2026-03-08T09:15:00Z',
    recruiter: {
      first_name: 'Pierre',
      last_name: 'Durand',
      email: 'pierre.durand@talent-mind.com'
    },
    recruiter_notes: 'Excellent profil technique, très motivée. Expérience solide en React et Node.js.',
    feedbacks: [
      {
        title: 'Entretien technique',
        description: 'Très bonnes compétences techniques, maîtrise parfaite de React',
        created_at: '2026-03-09T14:30:00Z',
        created_by: {
          first_name: 'Jean',
          last_name: 'Dupuis'
        }
      },
      {
        title: 'Entretien RH',
        description: 'Profil correspondant parfaitement aux attentes',
        created_at: '2026-03-10T10:00:00Z',
        created_by: {
          first_name: 'Marie',
          last_name: 'Leroy'
        }
      }
    ]
  },
  {
    id: '2',
    cv: {
      candidate_first_name: 'Thomas',
      candidate_last_name: 'Moreau',
      candidate_email: 'thomas.moreau@email.com',
      file_name: 'CV_Thomas_Moreau.pdf'
    },
    request: {
      title: 'Chef de Projet Digital',
      reference: 'REF-2026-002',
      client: { name: 'Digital Innovations' }
    },
    status: 'qualified',
    proposed_at: '2026-03-07T15:45:00Z',
    recruiter: {
      first_name: 'Claire',
      last_name: 'Rousseau',
      email: 'claire.rousseau@talent-mind.com'
    },
    recruiter_notes: 'Profil senior avec une excellente expérience en gestion de projet Agile.',
    feedbacks: [
      {
        title: 'Premier contact',
        description: 'Candidat très intéressé par le poste',
        created_at: '2026-03-08T11:00:00Z',
        created_by: {
          first_name: 'Claire',
          last_name: 'Rousseau'
        }
      }
    ]
  }
];

/**
 * Fonction pour tester l'export des demandes de recrutement
 */
export const testApplicationRequestsExport = () => {
  console.log('🧪 Test de l\'export des demandes de recrutement...');
  
  try {
    const result = exportApplicationRequestsToExcel(testApplicationRequests, 'test-demandes-recrutement');
    console.log('✅ Export réussi:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
};

/**
 * Fonction pour tester l'export des candidatures
 */
export const testCandidatesExport = () => {
  console.log('🧪 Test de l\'export des candidatures...');
  
  try {
    const result = exportCandidaturesToExcel(testCandidates, 'test-candidatures');
    console.log('✅ Export réussi:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    throw error;
  }
};

/**
 * Fonction pour tester les cas d'erreur
 */
export const testErrorCases = () => {
  console.log('🧪 Test des cas d\'erreur...');
  
  // Test avec tableau vide
  try {
    exportApplicationRequestsToExcel([], 'test-empty');
    console.log('❌ Devrait lever une erreur pour tableau vide');
  } catch (error) {
    console.log('✅ Erreur correctement levée pour tableau vide:', (error as Error).message);
  }
  
  // Test avec null
  try {
    exportCandidaturesToExcel(null as any, 'test-null');
    console.log('❌ Devrait lever une erreur pour null');
  } catch (error) {
    console.log('✅ Erreur correctement levée pour null:', (error as Error).message);
  }
};

/**
 * Fonction principale pour exécuter tous les tests
 */
export const runAllTests = () => {
  console.log('🚀 Démarrage des tests d\'export Excel...\n');
  
  try {
    testApplicationRequestsExport();
    console.log('');
    
    testCandidatesExport();
    console.log('');
    
    testErrorCases();
    console.log('');
    
    console.log('🎉 Tous les tests sont passés avec succès !');
  } catch (error) {
    console.error('💥 Échec des tests:', error);
  }
};

// Exporter les données de test pour utilisation externe
export { testApplicationRequests, testCandidates };