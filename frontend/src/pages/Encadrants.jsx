
import React, { useState, useEffect } from 'react';
import EncadrantsTable from '../components/tables/EncadrantsTable';
import EncadrantModal from '../components/forms/EncadrantForm';
import ErrorMessageModal from '../components/modals/ErrorMessageModal';
import { PlusCircle, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EncadrantsPage() {
  const [encadrants, setEncadrants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [editingEncadrant, setEditingEncadrant] = useState(null);

  const fetchEncadrants = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/encadrants/api/');
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setEncadrants(data);
    } catch (err) {
      setTableError(err.message || 'Erreur lors du chargement des encadrants');
      console.error("Erreur de récupération des encadrants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncadrants();
  }, []);

  const handleEncadrantDeleted = (deletedId) => {
    setEncadrants(prev => prev.filter(e => e.id !== deletedId));
  };

  const handleEditClick = (encadrant) => {
    setEditingEncadrant(encadrant);
    setIsModalOpen(true);
  };

  const handleEncadrantSaved = (savedEncadrant) => {
    if (editingEncadrant) {
      
      setEncadrants(prev => prev.map(e => 
        e.id === savedEncadrant.id ? savedEncadrant : e
      ));
    } else {
      
      setEncadrants(prev => [...prev, savedEncadrant]);
    }
    setIsModalOpen(false);
    setEditingEncadrant(null);
  };

  const handleAddClick = () => {
    setEditingEncadrant(null);
    setIsModalOpen(true);
  };

  const downloadPDF = () => {
    if (!filteredEncadrants.length) {
      setTableError("Aucun encadrant à exporter.");
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ["Nom", "Prénom", "Institution", "Email", "Téléphone"];
    const tableRows = filteredEncadrants.map(e => [
      e.nom,
      e.prenom,
      e.institution,
      e.email || "",
      e.telephone || ""
    ]);

    doc.text("Liste des encadrants", 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("encadrants.pdf");
  };

  const filteredEncadrants = encadrants.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.nom.toLowerCase().includes(term) ||
      e.prenom.toLowerCase().includes(term) ||
      (e.institution && e.institution.toLowerCase().includes(term)) ||
      (e.email && e.email.toLowerCase().includes(term)) ||
      (e.telephone && e.telephone.includes(term))
    );
  });

  return (
    <div>
      {/* Barre de recherche + boutons */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-sm mr-4">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un encadrant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-md"
          />
        </div>
        <div className="flex space-x-4">
          <button
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleAddClick}
          >
            <PlusCircle size={20} />
            <span className="hidden md:inline">Ajouter un encadrant</span>
          </button>
          <button
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            onClick={downloadPDF}
          >
            <Download size={20} />
            <span className="hidden md:inline">Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        <EncadrantsTable
          encadrants={filteredEncadrants}
          loading={loading}
          setParentError={setTableError}
          onEncadrantDeleted={handleEncadrantDeleted}
          onEncadrantEdit={handleEditClick}
        />
      </div>

      {/* Modal d'ajout/modification */}
      {isModalOpen && (
        <EncadrantModal
          initial={editingEncadrant}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEncadrant(null);
          }}
          onSaved={handleEncadrantSaved}
         
        />
      )}

      {/* Modal d'erreur */}
      <ErrorMessageModal
        message={tableError}
        onClose={() => setTableError(null)}
      />
    </div>
  );
}