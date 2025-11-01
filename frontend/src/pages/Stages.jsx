import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Download, Search, Filter, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import StagesTable from "../components/tables/StagesTable";
import StageForm from "../components/forms/StageForm";
import AlertesStages from "../components/AlertesStages";
import ErrorMessageModal from "../components/modals/ErrorMessageModal";
import AttestationModal from "../components/modals/AttestationModal"; 
import FiltrageAvance from "../components/modals/FiltrageAvance";
import { DIRECTION_OPTIONS, DIVISION_OPTIONS, UNITE_OPTIONS, SERVICE_OPTIONS } from "../components/stageformcomponents/StageConstants";

export default function StagesPage() {
  const API = "http://localhost:8000";
  
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [attestationStage, setAttestationStage] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({
    type: "none",
    year: new Date().getFullYear().toString(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: ""
  });
  
 
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [exportMode, setExportMode] = useState(false);

  
  const exportColumns = [
    { key: 'theme_type', label: 'Thème/Type' },
    { key: 'stagiaire', label: 'Stagiaire' },
    { key: 'encadrant', label: 'Encadrant' },
    { key: 'direction', label: 'Direction' },
    { key: 'affectation', label: 'Affectation' },
    { key: 'decision_lettre', label: 'Décision/Lettre' },
    { key: 'duree', label: 'Durée' },
    { key: 'statut', label: 'Statut' }
  ];

  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/stages/api/`);
      if (!response.ok) throw new Error("Erreur réseau");
      const data = await response.json();
      setStages(data);
    } catch (err) {
      setTableError(err.message || "Erreur lors du chargement des stages");
      console.error("Erreur de récupération des stages:", err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`${API}/dashboard/api/`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    }
  }, [API]);

  useEffect(() => {
    fetchStages();
    fetchDashboardData();
  }, [fetchStages, fetchDashboardData]);

  const handleStageSaved = () => {
    setIsModalOpen(false);
    setEditingStage(null);
    fetchStages();
    fetchDashboardData();
  };

  const handleEdit = (stage) => {
    setEditingStage(stage);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingStage(null);
    setIsModalOpen(true);
  };

  const filterByDate = (stage) => {
    if (dateFilter.type === "none") return true;

    const stageDate = new Date(stage.date_debut);
    
    switch (dateFilter.type) {
      case "year":
        if (!dateFilter.year) return true;
        return stageDate.getFullYear() === parseInt(dateFilter.year);
      
      case "month":
        if (!dateFilter.year || !dateFilter.month) return true;
        return stageDate.getFullYear() === parseInt(dateFilter.year) && 
               stageDate.getMonth() + 1 === parseInt(dateFilter.month);
      
      case "range":
        if (!dateFilter.startDate || !dateFilter.endDate) return true;
        const start = new Date(dateFilter.startDate);
        const end = new Date(dateFilter.endDate);
        return stageDate >= start && stageDate <= end;
      
      default:
        return true;
    }
  };

  const filteredStages = stages.filter((stage) => {

    const matchesSearch = 
      stage.theme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stage.stagiaire?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stage.stagiaire?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    
    const matchesDate = filterByDate(stage);
    
    
    const matchesAdvancedFilters = Object.entries(advancedFilters).every(([key, value]) => {
      if (!value || value === "") return true;
      
      const stageValue = stage[key];
      return stageValue === value;
    });
    
    return matchesSearch && matchesDate && matchesAdvancedFilters;
  });

  const resetAllFilters = () => {
    setAdvancedFilters({});
    setDateFilter({
      type: "none",
      year: new Date().getFullYear().toString(),
      month: new Date().getMonth() + 1,
      startDate: "",
      endDate: ""
    });
  };

  const isValidYear = (year) => {
    const yearNum = parseInt(year);
    return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 10;
  };

  
  const formatCellValue = (stage, columnKey) => {
    switch (columnKey) {
      case 'theme_type':
        return `${stage.theme || ''} / ${stage.type_stage || ''}`;
      
      case 'stagiaire':
        return `${stage.stagiaire?.prenom || ''} ${stage.stagiaire?.nom || ''}`;
      
      case 'encadrant':
        return stage.encadrant 
          ? `${stage.encadrant.prenom} ${stage.encadrant.nom}`
          : 'Non assigné';
      
      case 'direction':
        return stage.direction || 'Non définie';
      
      case 'affectation':
        if (stage.direction === 'BCR') {
          return `${stage.unite || 'Non définie'}${stage.service ? ` / ${stage.service}` : ''}`;
        } else {
          return stage.division || 'Non définie';
        }
      
      case 'decision_lettre':
        return stage.decision || 'Décision non renseignée';
      
      case 'duree':
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
        return `${formatDate(stage.date_debut)} → ${formatDate(stage.date_fin)}`;
      
      case 'statut':
        return stage.statut || '';
      
      default:
        return stage[columnKey] || '';
    }
  };

 
  const downloadPDFWithColumns = (selectedColumns) => {
    if (!filteredStages.length) {
      setTableError("Aucun stage à exporter.");
      return;
    }
    
    const doc = new jsPDF();
    
    
    let title = "Liste des Stages";
    if (dateFilter.type !== "none" || Object.keys(advancedFilters).length > 0) {
      title += " - Filtres: ";
      const filterParts = [];
      
      if (dateFilter.type !== "none") {
        switch (dateFilter.type) {
          case "year":
            filterParts.push(`Année ${dateFilter.year}`);
            break;
          case "month":
            const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
            filterParts.push(`${monthNames[dateFilter.month - 1]} ${dateFilter.year}`);
            break;
          case "range":
            filterParts.push(`Du ${dateFilter.startDate} au ${dateFilter.endDate}`);
            break;
        }
      }
      
      if (Object.keys(advancedFilters).length > 0) {
        Object.entries(advancedFilters).forEach(([key, value]) => {
          if (value && value !== "") {
            filterParts.push(getFilterLabel(key, value));
          }
        });
      }
      
      title += filterParts.join(' | ');
    }
    
    doc.text(title, 14, 15);
    
   
    const columnsToExport = exportColumns.filter(col => 
      selectedColumns.includes(col.key)
    );

    const head = columnsToExport.map(col => col.label);
    
    const body = filteredStages.map(stage => 
      columnsToExport.map(col => formatCellValue(stage, col.key))
    );

    autoTable(doc, {
      head: [head],
      body: body,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] } 
    });

    doc.save("stages_export.pdf");
  };

  const handleGenerateAttestation = async (stage, signataire, fonctionSignataire, format) => {
    try {
      const response = await fetch(`${API}/stages/api/${stage.id}/generer-attestation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signataire: signataire,
          fonction_signataire: fonctionSignataire,
          format: format
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const extension = format === 'docx' ? 'docx' : 'pdf';
      a.download = `attestation_stage_${stage.stagiaire.nom}_${stage.stagiaire.prenom}.${extension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Erreur génération attestation:', error);
      setTableError(error.message || 'Erreur lors de la génération de l\'attestation');
      throw error;
    }
  };

  const handleAttestationClick = (stage) => {
    setAttestationStage(stage);
  };

  const hasActiveAdvancedFilters = Object.keys(advancedFilters).length > 0 || dateFilter.type !== "none";
  const totalActiveFilters = Object.values(advancedFilters).filter(val => val && val !== "").length + 
                           (dateFilter.type !== "none" ? 1 : 0);

  
  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'type_stage':
        return `Type: ${value}`;
      case 'direction':
        const direction = DIRECTION_OPTIONS.find(dir => dir.value === value);
        return `Direction: ${direction ? direction.label.split(' - ')[1] : value}`;
      case 'division':
        return `Division: ${value}`;
      case 'unite':
        return `Unité: ${value}`;
      case 'service':
        return `Section: ${value}`;
      case 'statut':
        return `Statut: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };

  
  const getDateFilterLabel = () => {
    switch (dateFilter.type) {
      case "year":
        return `Année: ${dateFilter.year}`;
      case "month":
        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        return `Mois: ${monthNames[dateFilter.month - 1]} ${dateFilter.year}`;
      case "range":
        return `Période: ${dateFilter.startDate} → ${dateFilter.endDate}`;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Section Alertes */}
     

      {/* En-tête avec recherche et boutons */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Barre de recherche */}
          <div className="relative w-full max-w-sm">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un stage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border-0 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-md"
            />
          </div>

          {/* Bouton filtrage avancé*/}
          <div className="relative">
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors shadow-sm ${
                hasActiveAdvancedFilters
                  ? "bg-purple-100 text-purple-700 border border-purple-300" 
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
              Filtres Avancés
              {hasActiveAdvancedFilters && (
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalActiveFilters}
                </span>
              )}
            </button>

            {/* Menu déroulant filtrage avancé */}
            {showAdvancedFilter && (
              <FiltrageAvance
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                onClose={() => setShowAdvancedFilter(false)}
              />
            )}
          </div>

          {/* Indicateurs de filtres avancés actifs */}
          {dateFilter.type !== "none" && (
            <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              <Filter size={14} />
              <span>{getDateFilterLabel()}</span>
              <button
                onClick={() => setDateFilter({
                  type: "none",
                  year: new Date().getFullYear().toString(),
                  month: new Date().getMonth() + 1,
                  startDate: "",
                  endDate: ""
                })}
                className="text-purple-400 hover:text-purple-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Indicateurs de filtres avancés actifs */}
          {hasActiveAdvancedFilters && Object.entries(advancedFilters).map(([key, value]) => {
            if (!value || value === "") return null;
            
            return (
              <div key={key} className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                <Filter size={14} />
                <span>{getFilterLabel(key, value)}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...advancedFilters };
                    delete newFilters[key];
                    setAdvancedFilters(newFilters);
                  }}
                  className="text-purple-400 hover:text-purple-600"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusCircle size={20} />
            Ajouter un Stage
          </button>
          <button
            onClick={() => setExportMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download size={20} />
            Exporter
          </button>
        </div>
      </div>

      {/* Tableau des stages */}
      <StagesTable 
        stages={filteredStages} 
        loading={loading} 
        onStageDeleted={fetchStages} 
        onStageEdit={handleEdit}
        setParentError={setTableError}
        onGenerateAttestation={handleAttestationClick}
        onExport={downloadPDFWithColumns}
        exportMode={exportMode}
        onExportModeChange={setExportMode}
      />

      {/* Modal d'erreur */}
      <ErrorMessageModal
        message={tableError}
        onClose={() => setTableError(null)}
      />

      {/* Modal d'ajout/modification de stage */}
      {isModalOpen && (
        <StageForm
          initial={editingStage}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStage(null);
          }}
          onSaved={handleStageSaved}
        />
      )}
      
      <AttestationModal
        stage={attestationStage}
        isOpen={!!attestationStage}
        onClose={() => setAttestationStage(null)}
        onGenerate={handleGenerateAttestation}
      />
    </div>
  );
}