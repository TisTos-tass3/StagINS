import React from 'react';
import { Download, Check, Archive, Trash2, Pencil } from 'lucide-react';
import GenericTable from './GenericTable';

export default function RapportsTable({ rapports = [], loading, error, onEdit, onRefresh, onDeleted }) {
  const handleDownload = (rapport) => {
    fetch(`http://localhost:8000/rapports/api/${rapport.id}/download/`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `rapport_${rapport.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error(err);
        alert('Erreur lors du téléchargement.');
      });
  };

  const handleValider = (rapport) => {
    if (!window.confirm("Valider ce rapport ?")) return;
    fetch(`http://localhost:8000/rapports/api/${rapport.id}/valider/`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else onRefresh();
      })
      .catch(err => {
        console.error("Erreur de validation:", err);
        alert('Erreur lors de la validation.');
      });
  };

  const handleArchiver = (rapport) => {
    if (!window.confirm("Archiver ce rapport ?")) return;
    fetch(`http://localhost:8000/rapports/api/${rapport.id}/archiver/`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else onRefresh();
      })
      .catch(err => {
        console.error("Erreur d'archivage:", err);
        alert("Erreur lors de l'archivage.");
      });
  };

  

  const customActions = [
    {
      icon: <Check size={18} />,
    
      className: "text-green-500 hover:text-green-500",
      onClick: handleValider,
      condition: (rapport) => rapport.etat === 'En attente'
    },
    {
      icon: <Download size={18} />,
     
     
      className: "text-gray-500 hover:text-gray-500",
      onClick: handleDownload
    },
   
   
  ];

  const columns = [
    { 
      key: 'stagiaire', 
      label: 'Stagiaire',
      render: (value, item) => `${item.stage?.stagiaire?.nom || ''} ${item.stage?.stagiaire?.prenom || ''}`
    },
    { 
      key: 'theme', 
      label: 'Thème',
      render: (value, item) => item.stage?.theme,
      isTruncate: true
    },
    { 
      key: 'date_depot', 
      label: 'Date dépôt', 
      isDate: true 
    },
    { key: 'etat', label: 'État' }
  ];

 
  const handleDelete = (rapport) => {
    fetch(`http://localhost:8000/rapports/api/${rapport.id}/`, {
      method: 'DELETE',
    })
    .then(async res => {
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur inconnue');
      }
      return res.json();
    })
    .then(data => {
      if (data.deleted) {
        onDeleted(rapport.id);
      } else {
        throw new Error('La suppression a échoué.');
      }
    })
    .catch(err => {
      console.error("Erreur de suppression:", err);
      alert(err.message);
    });
  };



  return (
    <GenericTable
      data={rapports}
      columns={columns}
      loading={loading}
      error={error}
      onEdit={onEdit}
      onDelete={handleDelete} 
      customActions={customActions}
      emptyMessage="Aucun rapport trouvé."
      
    />
  );
}