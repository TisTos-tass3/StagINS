
export const API = "http://localhost:8000";

export const NIVEAU_ETUDE_OPTIONS = ['Bac +2', 'Bac +3', 'Bac +5', 'Bac +8'];
export const TYPE_STAGE_OPTIONS = ['Academique', 'Professionnel'];

// CONSTANTES POUR LES DIRECTIONS
export const DIRECTION_OPTIONS = [
  { value: 'DGE', label: 'DGE - Direction Générale des Études' },
  { value: 'DF', label: 'DF - Direction des Finances' },
  { value: 'DRH', label: 'DRH - Direction des Ressources Humaines' },
  { value: 'DSI', label: 'DSI - Direction des Systèmes d\'Information' },
  { value: 'BCR', label: 'BCR - Bureau du Recensement National' },
];

// DIVISIONS POUR LES AUTRES DIRECTIONS
export const DIVISION_OPTIONS = {
  'DGE': [
    'Division des Études Économiques',
    'Division des Études Sociales',
  ],
  'DF': [
    'Division de la Comptabilité',
    'Division du Budget',
  ],
  'DRH': [
    'Division du Recrutement',
    'Division de la Formation',
  ],
  'DSI': [
    'Division du Développement',
    'Division de l\'Infrastructure',
  ],
  'BCR': [], 
};

export const DIRECTION_FULL_NAMES = {
  'DGE': 'Direction Générale des Études',
  'DF': 'Direction des Finances',
  'DRH': 'Direction des Ressources Humaines',
  'DSI': 'Direction des Systèmes d\'Information',
  'BCR': 'Bureau du Recensement National',
};

// UNITÉS SPÉCIFIQUES AU BCR 
export const UNITE_OPTIONS = [
  'Unité Méthodologie, Études et Opérations de terrain',
  'Unité Cartographie et SIG',
  'Unité Informatique ',
  'Unité des Ressources Financières et du Matériel',
  'Unité des Ressources Humaines',
  'Unité de Communication Digitale et Multimédia',
  'Unité de Suivi Évaluation et de la Documentation',
  'Unité de Plaidoyer, Mobilisation Sociale et Sensibilisation'
];

// SECTIONS SPÉCIFIQUES AU BCR 
export const SERVICE_OPTIONS = {
  'Unité Méthodologie, Études et Opérations de terrain': [
    'Section « Méthodologie et Opérations de Terrain »',
    'Section « Analyse des Données et Production des Résultats »'
  ],
  'Unité Cartographie et SIG': [
    'Section de la cartographie censitaire',
    'Section du Système d\'Information Géographique '
  ],
  'Unité Informatique ': [
    'Section Infrastructure et Réseau',
    'Section Étude et Développement des Applications',
    'Section Gestion des Bases de Données, Anonymisation et Archivage'
  ],
  'Unité des Ressources Financières et du Matériel': [
    'Section Comptabilité',
    'Section Engagements Financiers',
    'Section Matériel et Logistique'
  ],
  'Unité des Ressources Humaines': [
    'Section administrative et du personnel',
    'Section renforcement des capacités'
  ],
  'Unité de Communication Digitale et Multimédia': [
    'Section Communication Digitale',
    'Section Communication Multimédia'
  ],
  'Unité de Suivi Évaluation et de la Documentation': [
    'Section Suivi et Évaluation',
    'Section Documentation'
  ],
  'Unité de Plaidoyer, Mobilisation Sociale et Sensibilisation': [
    'Section Plaidoyer',
    'Section Sensibilisation et Mobilisation Sociale'
  ]

  
};