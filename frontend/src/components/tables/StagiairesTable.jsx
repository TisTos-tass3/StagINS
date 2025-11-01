import React from 'react';
import GenericTable from './GenericTable';

export default function StagiairesTable({ stagiaires, loading, error, onStagiaireDeleted, onStagiaireEdit }) {
  const columns = [
    { 
      key: 'matricule', 
      label: 'Matricule',
      responsiveClass: 'whitespace-nowrap'
    },
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { 
      key: 'ecole', 
      label: 'École', 
      responsiveClass: 'hidden lg:table-cell',
      isTruncate: true
    },
    { 
      key: 'specialite', 
      label: 'Spécialité', 
      responsiveClass: 'hidden lg:table-cell',
      isTruncate: true
    },
    { 
      key: 'niveau_etude', 
      label: 'Niveau', 
      responsiveClass: 'hidden md:table-cell' 
    },
    { 
      key: 'email', 
      label: 'Email', 
      responsiveClass: 'hidden xl:table-cell',
      isTruncate: true
    },
    { 
      key: 'telephone', 
      label: 'Téléphone', 
      responsiveClass: 'hidden xl:table-cell' 
    }
  ];

  const handleDelete = (stagiaire) => {
    if (("Êtes-vous sûr de vouloir supprimer ce stagiaire ?")) {
      fetch(`http://localhost:8000/stagiaires/api/${stagiaire.id}/`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) throw new Error('Erreur lors de la suppression');
          onStagiaireDeleted();
        })
        .catch(error => {
          console.error("Erreur lors de la suppression:", error);
        });
    }
  };

  const buildStagiaireLink = (stagiaire) => {
    return `/stagiaires/${stagiaire.id}`;
  };


  return (
    <GenericTable
      data={stagiaires}
      columns={columns}
      loading={loading}
      error={error}
      onEdit={onStagiaireEdit}
      onDelete={handleDelete}
      showLink={true}
      linkKey="matricule" 
      linkLabel="Consulter le dossier du stagiaire"
      linkBuilder={buildStagiaireLink} 
     
      emptyMessage="Aucun stagiaire trouvé."
    />
  );
}