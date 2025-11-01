import React from "react";
import GenericTable from "./GenericTable";
import { File, ArrowRight, FileBadge } from "lucide-react";
import { DIRECTION_FULL_NAMES } from "../stageformcomponents/StageConstants";

export default function StagesTable({ 
  stages, 
  loading, 
  error, 
  onStageDeleted, 
  onStageEdit, 
  setParentError, 
  onGenerateAttestation,
  onExport,
  exportMode,
  onExportModeChange 
}) {
  const statusConfig = {
    'En cours': 'bg-blue-100 text-blue-800',
    'Terminé': 'bg-red-100 text-red-800',
    'Validé': 'bg-green-100 text-green-800',
    'default': 'bg-gray-100 text-gray-800'
  };


  const getDirectionFullName = (directionCode) => {
    if (!directionCode) return 'Non spécifiée';
    return DIRECTION_FULL_NAMES[directionCode] || directionCode;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };
  
 
  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  
 
  const getServiceAcronym = (serviceName) => {
    if (!serviceName) return null;

    
    if (serviceName.includes('Système d\'Information Géographique')) return 'SIG';

    let normalizedName = serviceName.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    
    let cleanedName = normalizedName
      .replace(/Section\s*|«|»/g, '')
      .replace(/\s*\(.*\)/g, '')
      .trim();

    const ignoredWords = new Set(['et', 'des', 'de', 'du', 'la', 'le', 'les', 'a', 'aux', 'un', 'une', 'd\'', 'l\'', 'au', 'en', 'avec', 'par', 'pour', 'sur', 'dans', 'ou', 'y', 'sont', 'il', 'elle', 'ce', 'qui', 'que', 'son', 'sa', 'ses', 'ces']);

    const words = cleanedName.split(/[\s,-]/).filter(word => word.length > 0);

    let acronymPart = words
      .filter(word => {
        const lowerWord = word.toLowerCase();
        return word.length > 1 && !ignoredWords.has(lowerWord);
      })
      .map(word => word.charAt(0))
      .join('');
      
    let finalAcronym = "";

    if (acronymPart.length >= 1) {
        finalAcronym = 'S' + acronymPart;
    } else {
        const firstSignificantWord = words.find(word => !ignoredWords.has(word.toLowerCase()));
        if (firstSignificantWord) {
            finalAcronym = 'S' + firstSignificantWord.charAt(0);
        }
    }

    if (finalAcronym.length > 1) {
      return finalAcronym.toUpperCase();
    }
    
    return null;
  };

  
  const getAffectationDisplay = (stage) => {
    if (stage.direction === 'BCR') {
    
      const uniteName = stage.unite || <span className="text-gray-400 italic">Non définie</span>;
      const serviceAcronym = getServiceAcronym(stage.service);
      
      return (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{uniteName}</span>
          {stage.service ? (
            <span className="text-xs text-gray-500 mt-0.5" title={stage.service}>
              {serviceAcronym || stage.service}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic mt-0.5">
              (Pas de section)
            </span>
          )}
        </div>
      );
    } else {
      
      return stage.division ? (
        <span className="font-medium text-gray-900">{stage.division}</span>
      ) : (
        <span className="text-gray-400 italic">Non définie</span>
      );
    }
  };

  const columns = [
      { 
      key: 'theme_type', 
      label: 'Thème/Type', 
      isTruncate: true,
      render: (value, item) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{item.theme}</span>
          <span className="text-xs text-gray-500 mt-0.5">
            {item.type_stage}
          </span>
        </div>
      )
    },

    { 
      key: 'stagiaire', 
      label: 'Stagiaire',
      render: (value, item) => `${item.stagiaire?.prenom || ''} ${item.stagiaire?.nom || ''}`
    },
    { 
      key: 'encadrant', 
      label: 'Encadrant',
      render: (value, item) => item.encadrant ? `${item.encadrant.prenom} ${item.encadrant.nom}` : <span className="text-gray-400 italic">Non assigné</span>
    },
    
    { 
      key: 'direction', 
      label: 'Direction',
      responsiveClass: 'hidden lg:table-cell',
      render: (value, item) => (
        <span 
          className="font-medium text-gray-900"
          title={getDirectionFullName(item.direction)}
        >
          {item.direction || <span className="text-gray-400 italic">Non définie</span>}
        </span>
      )
    },
    
    { 
      key: 'affectation', 
      label: 'Affectation',
      responsiveClass: 'hidden lg:table-cell',
      render: (value, item) => getAffectationDisplay(item)
    },
    { 
      key: 'decision_lettre', 
      label: 'Décision / Lettre',
      responsiveClass: 'hidden lg:table-cell',
      render: (value, item) => (
        <div className="flex flex-col space-y-1">
          {item.decision ? (
            <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 self-start">
              {item.decision}
            </span>
          ) : (
            <span className="text-gray-400 italic text-sm">Décision non renseignée</span>
          )}

          {item.lettre_acceptation_url ? (
            <a 
              href={item.lettre_acceptation_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition-colors text-xs mt-1"
            >
              <File size={14} />
              <span>Télécharger</span>
            </a>
          ) : (
            <span className="text-gray-400 italic text-xs flex items-center space-x-1 mt-1">
                <File size={14} />
                <span>Lettre non uploadée</span>
            </span>
          )}
        </div>
      )
    },
    
  
    { 
      key: 'duree', 
      label: 'Date début→ Date fin', 
      isDate: false,
      responsiveClass: 'hidden md:table-cell',
      render: (value, item) => (
        <div className="flex items-center space-x-2 text-sm">
          <span 
            className="font-medium" 
            title={formatFullDate(item.date_debut)}
          >
            {formatDate(item.date_debut)}
          </span>
          <ArrowRight size={14} className="text-gray-400" />
          <span 
            className="font-medium"
            title={formatFullDate(item.date_fin)}
          >
            {formatDate(item.date_fin)}
          </span>
        </div>
      )
    },
    
    { 
      key: 'statut', 
      label: 'Statut', 
      isStatus: true,
      statusConfig: statusConfig
    }
  ];

  const handleDelete = (stage) => {
    if (("Êtes-vous sûr de vouloir supprimer ce stage ?")) {
      fetch(`http://localhost:8000/stages/api/${stage.id}/`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) throw new Error("Erreur lors de la suppression");
          onStageDeleted();
        })
        .catch((error) => {
          console.error("Erreur lors de la suppression:", error);
          if (setParentError) {
            setParentError("Erreur lors de la suppression du stage");
          }
        });
    }
  };

   const customActions = [
  {
    icon: <FileBadge size={18} />,
    title: stage => stage.statut === 'Validé' 
      ? "Générer attestation" 
      : "Stage non validé - Impossible de générer l'attestation",
    className: stage => stage.statut === 'Validé' 
      ? "text-purple-600 hover:text-purple-800 transition-colors" 
      : "text-gray-400 cursor-not-allowed",
    condition: (stage) => stage.statut === 'Validé',  
    onClick: onGenerateAttestation
  }
  ];

  return (
    <GenericTable
      data={stages}
      columns={columns}
      loading={loading}
      error={error}
      onEdit={onStageEdit}
      onDelete={handleDelete}
      customActions={customActions}
      onExport={onExport}
      exportMode={exportMode}
      onExportModeChange={onExportModeChange}
      emptyMessage="Aucun stage trouvé."
    />
  );
}