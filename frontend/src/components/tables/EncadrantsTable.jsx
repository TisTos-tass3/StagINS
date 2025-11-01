import React from 'react';
import GenericTable from './GenericTable';

export default function EncadrantsTable({ encadrants, loading, onEncadrantDeleted, onEncadrantEdit, setParentError }) {



const columns = [
  { key: 'nom', label: 'Nom' },
  { key: 'prenom', label: 'Prénom' },
  { 
    key: 'institution', 
    label: 'Institution',
    render: (value, item) => (
      <div>
        <div>{value}</div>
        {value === 'Externe' && item.nom_institution && (
          <div className="text-xs text-gray-500 mt-1">
            {item.nom_institution}
          </div>
        )}
      </div>
    )
  },
  { 
    key: 'email', 
    label: 'Email', 
    responsiveClass: 'hidden lg:table-cell',
    isTruncate: true
  },
  { 
    key: 'telephone', 
    label: 'Téléphone', 
    responsiveClass: 'hidden md:table-cell' 
  }
];

  const handleDelete = (encadrant) => {
    if (`Êtes-vous sûr de vouloir supprimer l'encadrant "${encadrant.prenom} ${encadrant.nom}" ?`) {
      
     
      setParentError(null); 

      fetch(`http://localhost:8000/encadrants/api/${encadrant.id}/`, { 
        method: 'DELETE' 
      })
        .then(async (res) => {
          const data = await res.json();
          
          if (!res.ok) {
            let errorMessage = "Erreur lors de la suppression.";
            
          
            if (res.status === 400) {
             
              errorMessage = data.error || "Impossible de supprimer cet encadrant (règle métier non respectée).";
            } else if (res.status === 404) {
              errorMessage = "Encadrant non trouvé.";
            } else if (res.status === 500) {
              errorMessage = "Erreur serveur lors de la suppression. Veuillez réessayer.";
            } else {
              
              errorMessage = data.detail || `Erreur ${res.status} lors de la suppression.`;
            }
            
          
            throw new Error(errorMessage);
          }
          
        
          onEncadrantDeleted(encadrant.id);
          
       
          if (data.message) {
             console.log(data.message);
          }
        })
        .catch(err => {
         
          setParentError(err.message);
          console.error("Erreur de suppression:", err);
        });
    }
  };


  return (
    <GenericTable
      columns={columns}
      data={encadrants}
      loading={loading}
      onEdit={onEncadrantEdit}
      onDelete={handleDelete}
      
    />
  );
}