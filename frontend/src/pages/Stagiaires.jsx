
import React, { useState, useEffect } from 'react';
import StagiairesTable from '../components/tables/StagiairesTable';
import StagiaireModal from '../components/forms/StagiaireForm';
import SearchModal from '../components/modals/SearchModal';
import { Download, Search, UserRoundSearch } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function StagiairesPage() {
 
  const [stagiaires, setStagiaires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [isStagiaireModalOpen, setIsStagiaireModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  
  const [editId, setEditId] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    ecole: '',
    specialite: '',
    niveau_etude: 'Bac +2',
    telephone: ''
  });

 
  const fetchStagiaires = () => {
    setLoading(true);
    setError(null);
    
    fetch('http://localhost:8000/stagiaires/api/')
      .then(response => {
        if (!response.ok) throw new Error('Erreur de la réponse réseau');
        return response.json();
      })
      .then(data => {
        setStagiaires(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        console.error("Erreur de récupération des stagiaires:", err);
      });
  };

  useEffect(() => {
    fetchStagiaires();
  }, []);

 
  const handleFormDataChange = (name, value) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

 
  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      ecole: '',
      specialite: '',
      niveau_etude: 'Bac +2',
      telephone: ''
    });
    setModalError(null);
    setModalLoading(false);
    setEditId(null);
  };

  
  const handleCloseStagiaireModal = () => {
    setIsStagiaireModalOpen(false);
    resetForm();
  };

  
  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

 
  const handleSubmitStagiaire = async () => {
    setModalLoading(true);
    setModalError(null);

    try {
      const url = `http://localhost:8000/stagiaires/api/${editId}/`;
      const method = 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      await response.json();
      handleCloseStagiaireModal();
      fetchStagiaires();
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

 
  const handleEdit = (stagiaire) => {
    setEditId(stagiaire.id);
    setFormData(stagiaire);
    setIsStagiaireModalOpen(true);
  };

  const filteredStagiaires = stagiaires.filter(s =>
    (s.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.ecole?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.specialite?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (s.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Stagiaires", 14, 15);
    autoTable(doc, {
      head: [['Matricule', 'Nom', 'Prénom', 'Email', 'École', 'Spécialité', 'Niveau d\'étude', 'Téléphone']],
      body: filteredStagiaires.map(s => [
        s.matricule || 'N/A', 
        s.nom, 
        s.prenom, 
        s.email, 
        s.ecole, 
        s.specialite, 
        s.niveau_etude, 
        s.telephone
      ]),
      startY: 20
    });
    doc.save('stagiaires_list.pdf');
  };

 return (
  <div className="flex-1">
    {/* En-tête*/}
    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
      <div className="relative w-full max-w-sm mr-4">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un stagiaire..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 pl-10 border-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-md"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-sm"
        >
          <UserRoundSearch size={20} />
          Recherche Avancée
        </button>

        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download size={20} />
          Exporter PDF
        </button>
      </div>
    </div>

    {/* Tableau des stagiaires */}
    <div >
      <StagiairesTable
        stagiaires={filteredStagiaires}
        loading={loading}
        error={error}
        onStagiaireDeleted={fetchStagiaires}
        onStagiaireEdit={handleEdit}
      />
    </div>

     
    <StagiaireModal
      isOpen={isStagiaireModalOpen}
      onClose={handleCloseStagiaireModal}
      isEditMode={true}
      formData={formData}
      onSubmit={handleSubmitStagiaire}
      onFormDataChange={handleFormDataChange}
      loading={modalLoading}
      error={modalError}
    />

    {/* Modal de recherche */}
    <SearchModal
      isOpen={isSearchModalOpen}
      onClose={handleCloseSearchModal}
    />
  </div>
);
}