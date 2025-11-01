
import React, { useEffect, useState } from 'react';
import RapportModal from '../components/forms/RapportForm';
import RapportsTable from '../components/tables/RapportsTable';
import { PlusCircle, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RapportsPage() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRapport, setEditingRapport] = useState(null);


  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');
  const [anneeFilter, setAnneeFilter] = useState('');
  
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (etatFilter) params.append('etat', etatFilter);
    if (anneeFilter) params.append('annee', anneeFilter);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchRapports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/rapports/api/${buildQuery()}`);
      if (!response.ok) {
        throw new Error('Erreur de réseau ou de serveur');
      }
      const data = await response.json();
      setRapports(data);
    } catch (err) {
      setError(err);
      console.error("Erreur de récupération des rapports :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, [search, etatFilter, anneeFilter]);

  const onRapportDeleted = (id) => {
    setRapports(currentRapports => currentRapports.filter(r => r.id !== id));
  };
  
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Rapports de Stage", 14, 20);

    const tableData = rapports.map(r => [
     
      `${r.stage.stagiaire.prenom} ${r.stage.stagiaire.nom}`,
      r.stage.theme,
      new Date(r.date_depot).toLocaleDateString(),
      r.etat
    ]);

    autoTable(doc, {
      head: [['Stagiaire', 'Stage', 'Date de dépôt', 'État']],
      body: tableData,
      startY: 30,
    });

    doc.save('rapports.pdf');
  };

  const handleRapportSaved = () => {
    fetchRapports();
    setIsModalOpen(false);
    setEditingRapport(null);
  };

  return (
    <div >
      {/* Barre de contrôle */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
        
        {/* Groupe Recherche et Filtres*/}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
         
          <div className="relative w-full sm:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Rechercher par titre, stagiaire ou thème"
              className="w-full p-2 pl-10 border-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-md sm:w-64"
            />
          </div>
          
          {/* Filtre État */}
          <select 
            value={etatFilter} 
            onChange={e => setEtatFilter(e.target.value)} 
            className="p-2 border rounded-md shadow-sm bg-white h-10 w-full sm:w-auto"
          >
            <option value="">Tous les états</option>
            <option>En attente</option>
            <option>Validé</option>
            <option>Archivé</option>
          </select>
          
          {/* Filtre Année */}
          <input 
            value={anneeFilter} 
            onChange={e => setAnneeFilter(e.target.value)} 
            placeholder="Année (ex: 2025)" 
            className="p-2 border rounded-md shadow-sm bg-white h-10 w-full sm:w-24" 
          />
        </div>

        
        <div className="flex space-x-4 w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <PlusCircle size={20} />
            Soumettre un rapport
          </button>
          
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            <Download size={20} />
            Exporter PDF
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <RapportsTable
          rapports={rapports}
          loading={loading}
          error={error}
          onEdit={(r) => { setEditingRapport(r); setIsModalOpen(true); }}
          onRefresh={fetchRapports}
          onDeleted={onRapportDeleted}
        />
      </div>

      {isModalOpen && (
        <RapportModal
          initial={editingRapport}
          onClose={() => { setIsModalOpen(false); setEditingRapport(null); }}
          onSaved={handleRapportSaved}
        />
      )}
    </div>
  );

}