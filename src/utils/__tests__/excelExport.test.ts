import { exportApplicationRequestsToExcel, exportCandidaturesToExcel, type ExportableCandidate } from '../excelExport';
import type { ApplicationRequest } from '@/types/applicationRequest';

// Mock des données de test
const mockApplicationRequests: ApplicationRequest[] = [
  {
    id: '1',
    reference: 'REF-001',
    title: 'Développeur Full Stack',
    description: 'Poste de développeur expérimenté',
    client: { id: '1', name: 'Client Test' },
    manager: { id: '1', first_name: 'John', last_name: 'Doe' },
    status: 'open',
    priority: 'high',
    contract_type: 'CDI',
    location: 'Paris',
    country: 'France',
    work_type: 'full_time',
    remote_possible: true,
    remote_days_per_week: 2,
    required_skills: 'React, Node.js, TypeScript',
    min_experience: 3,
    max_experience: 7,
    min_salary: 45000,
    max_salary: 65000,
    daily_rate_min: null,
    daily_rate_max: null,
    mission_duration_months: null,
    mission_renewable: false,
    languages: 'Français, Anglais',
    benefits: 'Tickets restaurant, mutuelle',
    bonuses: 'Prime annuelle',
    variables: 'Intéressement',
    number_of_profiles: 1,
    desired_start_date: '2026-04-01',
    created_at: '2026-03-10T10:00:00Z',
    updated_at: '2026-03-10T12:00:00Z',
  } as ApplicationRequest
];

const mockCandidates: ExportableCandidate[] = [
  {
    id: '1',
    cv: {
      candidate_first_name: 'Marie',
      candidate_last_name: 'Dupont',
      candidate_email: 'marie.dupont@email.com',
      file_name: 'cv_marie_dupont.pdf'
    },
    request: {
      title: 'Développeur Full Stack',
      reference: 'REF-001',
      client: { name: 'Client Test' }
    },
    status: 'interview',
    proposed_at: '2026-03-08T09:00:00Z',
    recruiter: {
      first_name: 'Pierre',
      last_name: 'Martin',
      email: 'pierre.martin@company.com'
    },
    recruiter_notes: 'Candidat très prometteur',
    feedbacks: [
      {
        title: 'Premier entretien',
        description: 'Très bon profil technique',
        created_at: '2026-03-09T14:00:00Z',
        created_by: {
          first_name: 'Sophie',
          last_name: 'Bernard'
        }
      }
    ]
  }
];

describe('Excel Export Functions', () => {
  // Mock des fonctions DOM pour les tests
  beforeAll(() => {
    // Mock createElement
    global.document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          setAttribute: jest.fn(),
          click: jest.fn(),
          style: {}
        };
      }
      return {};
    });

    // Mock body.appendChild et removeChild
    global.document.body.appendChild = jest.fn();
    global.document.body.removeChild = jest.fn();

    // Mock URL.createObjectURL et revokeObjectURL
    global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock Blob
    global.Blob = jest.fn().mockImplementation((content, options) => ({
      content,
      options
    })) as any;
  });

  describe('exportApplicationRequestsToExcel', () => {
    it('should export application requests successfully', () => {
      const result = exportApplicationRequestsToExcel(mockApplicationRequests, 'test-demandes');
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/test-demandes_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should throw error when no data provided', () => {
      expect(() => exportApplicationRequestsToExcel([], 'test')).toThrow('Aucune donnée à exporter');
      expect(() => exportApplicationRequestsToExcel(null as any, 'test')).toThrow('Aucune donnée à exporter');
    });
  });

  describe('exportCandidaturesToExcel', () => {
    it('should export candidates successfully', () => {
      const result = exportCandidaturesToExcel(mockCandidates, 'test-candidatures');
      
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.filename).toMatch(/test-candidatures_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should throw error when no data provided', () => {
      expect(() => exportCandidaturesToExcel([], 'test')).toThrow('Aucune donnée à exporter');
      expect(() => exportCandidaturesToExcel(null as any, 'test')).toThrow('Aucune donnée à exporter');
    });
  });
});