import type { ApplicationRequest } from '@/types/applicationRequest';

export interface ExportableCandidate {
  id: string;
  cv?: {
    candidate_first_name?: string;
    candidate_last_name?: string;
    candidate_email?: string;
    file_name?: string;
  };
  request?: {
    title?: string;
    reference?: string;
    client?: {
      name?: string;
    };
  };
  status: string;
  proposed_at?: string;
  recruiter?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  recruiter_notes?: string;
  feedbacks?: Array<{
    title: string;
    description: string;
    created_at: string;
    created_by?: {
      first_name?: string;
      last_name?: string;
    };
  }>;
}

/**
 * Exporte les demandes de recrutement vers Excel (CSV compatible)
 */
export const exportApplicationRequestsToExcel = (
  requests: ApplicationRequest[],
  filename: string = 'demandes-recrutement'
) => {
  if (!requests || requests.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  try {
    // Préparer les données pour l'export
    const exportData = requests.map((request, index) => ({
      'N°': index + 1,
      'Référence': request.reference || '-',
      'Titre': request.title || '-',
      'Client': request.client?.name || '-',
      'Manager': request.manager ? `${request.manager.first_name || ''} ${request.manager.last_name || ''}`.trim() : '-',
      'Statut': getStatusLabel(request.status),
      'Priorité': getUrgencyLabel(request.priority || ''),
      'Type de contrat': request.contract_type || '-',
      'Localisation': request.location || '-',
      'Pays': request.country || '-',
      'Type de travail': getWorkTypeLabel(request.work_type || ''),
      'Télétravail possible': request.remote_possible ? 'Oui' : 'Non',
      'Jours télétravail/semaine': request.remote_days_per_week || '-',
      'Compétences requises': request.required_skills || '-',
      'Expérience min (années)': request.min_experience || '-',
      'Expérience max (années)': request.max_experience || '-',
      'Salaire min': request.min_salary || '-',
      'Salaire max': request.max_salary || '-',
      'TJM min': request.daily_rate_min || '-',
      'TJM max': request.daily_rate_max || '-',
      'Durée mission (mois)': request.mission_duration_months || '-',
      'Mission renouvelable': request.mission_renewable ? 'Oui' : 'Non',
      'Langues': request.languages || '-',
      'Avantages': request.benefits || '-',
      'Primes': request.bonuses || '-',
      'Variables': request.variables || '-',
      'Nombre de profils': request.number_of_profiles || '-',
      'Date de début souhaitée': request.desired_start_date ? 
        new Date(request.desired_start_date).toLocaleDateString('fr-FR') : '-',
      'Date de création': request.created_at ? 
        new Date(request.created_at).toLocaleDateString('fr-FR') : '-',
      'Dernière modification': request.updated_at ? 
        new Date(request.updated_at).toLocaleDateString('fr-FR') : '-',
      'Description': request.description || '-',
    }));

    // Convertir en CSV avec BOM UTF-8 pour Excel
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Échapper les guillemets et entourer de guillemets si nécessaire
          const stringValue = String(value || '').replace(/"/g, '""');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
            ? `"${stringValue}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Créer et télécharger le fichier avec BOM UTF-8
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.csv`;
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true, filename: finalFilename, count: requests.length };
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw new Error('Erreur lors de la génération du fichier Excel');
  }
};

/**
 * Exporte les candidatures vers Excel (CSV compatible)
 */
export const exportCandidaturesToExcel = (
  candidates: ExportableCandidate[],
  filename: string = 'candidatures'
) => {
  if (!candidates || candidates.length === 0) {
    throw new Error('Aucune donnée à exporter');
  }

  try {
    // Préparer les données pour l'export
    const exportData = candidates.map((candidate, index) => ({
      'N°': index + 1,
      'Prénom': candidate.cv?.candidate_first_name || '-',
      'Nom': candidate.cv?.candidate_last_name || '-',
      'Email': candidate.cv?.candidate_email || '-',
      'Fichier CV': candidate.cv?.file_name || '-',
      'Poste': candidate.request?.title || '-',
      'Référence offre': candidate.request?.reference || '-',
      'Client': candidate.request?.client?.name || '-',
      'Statut': getStatusLabel(candidate.status),
      'Date de proposition': candidate.proposed_at ? 
        new Date(candidate.proposed_at).toLocaleDateString('fr-FR') : '-',
      'Recruteur': candidate.recruiter ? 
        `${candidate.recruiter.first_name || ''} ${candidate.recruiter.last_name || ''}`.trim() : '-',
      'Email recruteur': candidate.recruiter?.email || '-',
      'Notes recruteur': candidate.recruiter_notes || '-',
      'Nombre de feedbacks': candidate.feedbacks?.length || 0,
      'Dernier feedback': candidate.feedbacks && candidate.feedbacks.length > 0 ? 
        candidate.feedbacks[candidate.feedbacks.length - 1].title : '-',
      'Date dernier feedback': candidate.feedbacks && candidate.feedbacks.length > 0 ? 
        new Date(candidate.feedbacks[candidate.feedbacks.length - 1].created_at).toLocaleDateString('fr-FR') : '-',
    }));

    // Convertir en CSV avec BOM UTF-8 pour Excel
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Échapper les guillemets et entourer de guillemets si nécessaire
          const stringValue = String(value || '').replace(/"/g, '""');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') 
            ? `"${stringValue}"` 
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Créer et télécharger le fichier avec BOM UTF-8
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.csv`;
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true, filename: finalFilename, count: candidates.length };
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw new Error('Erreur lors de la génération du fichier Excel');
  }
};

// Fonctions utilitaires pour les labels
const getStatusLabel = (status: string) => {
  switch (status) {
    case "in_progress":
      return "En cours";
    case "standby":
      return "Standby";
    case "abandoned":
      return "Abandonnée";
    case "filled":
      return "Comblée";
    case "open":
      return "Ouverte";
    case "proposed":
      return "Proposé";
    case "pending":
      return "En attente";
    case "interview":
      return "Entretien";
    case "qualified":
      return "Qualifié";
    case "accepted":
      return "Accepté";
    case "rejected":
      return "Refusé";
    default:
      return status;
  }
};

const getUrgencyLabel = (priority: string) => {
  switch (priority) {
    case "low":
      return "Faible";
    case "medium":
      return "Moyenne";
    case "high":
      return "Élevée";
    case "urgent":
      return "Urgente";
    default:
      return priority;
  }
};

const getWorkTypeLabel = (workType: string) => {
  switch (workType) {
    case "full_time":
      return "Temps plein";
    case "part_time":
      return "Temps partiel";
    case "contract":
      return "Contrat";
    case "freelance":
      return "Freelance";
    default:
      return workType;
  }
};