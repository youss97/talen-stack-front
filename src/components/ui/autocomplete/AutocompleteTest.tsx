'use client';

import { useState } from 'react';
import Autocomplete from './Autocomplete';

// Données de test pour simuler des candidatures
const mockCandidates = [
  {
    value: '1',
    label: 'Jean Dupont',
    subtitle: 'Développeur Full Stack - TechCorp (REF-001)'
  },
  {
    value: '2', 
    label: 'Marie Martin',
    subtitle: 'Designer UX/UI - DesignStudio (REF-002)'
  },
  {
    value: '3',
    label: 'Pierre Durand',
    subtitle: 'Chef de Projet - ProjectCorp (REF-003)'
  },
  {
    value: '4',
    label: 'Sophie Leroy',
    subtitle: 'Développeuse Frontend - WebAgency (REF-004)'
  },
  {
    value: '5',
    label: 'Thomas Bernard',
    subtitle: 'Analyste Business - ConsultFirm (REF-005)'
  }
];

export default function AutocompleteTest() {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Test Autocomplete Candidature
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionner un candidat
          </label>
          <Autocomplete
            options={mockCandidates}
            value={selectedValue}
            onChange={setSelectedValue}
            placeholder="Rechercher un candidat..."
            noOptionsMessage="Aucun candidat trouvé"
            searchPlaceholder="Tapez le nom du candidat ou le poste..."
          />
        </div>
        
        {selectedValue && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Candidat sélectionné :</strong> {selectedValue}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {mockCandidates.find(c => c.value === selectedValue)?.label} - {mockCandidates.find(c => c.value === selectedValue)?.subtitle}
            </p>
          </div>
        )}
        
        <button
          onClick={() => setSelectedValue('')}
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}