import React from "react";
import { Filter, X } from "lucide-react";
import { 
  TYPE_STAGE_OPTIONS, 
  DIRECTION_OPTIONS, 
  DIVISION_OPTIONS,
  UNITE_OPTIONS,
  SERVICE_OPTIONS 
} from "../stageformcomponents/StageConstants";

export default function FiltrageAvance({ 
  filters, 
  onFiltersChange, 
  onClose,
  dateFilter,
  onDateFilterChange 
}) {
  const statusOptions = ['En attente', 'En cours', 'Validé', 'Terminé'];

  const handleFilterChange = (filterType, value) => {
    if (value === "") {
      // Si valeur vide, supprimer le filtre
      const newFilters = { ...filters };
      delete newFilters[filterType];
      onFiltersChange(newFilters);
    } else {
      // Sinon mettre à jour le filtre
      onFiltersChange({
        ...filters,
        [filterType]: value
      });
    }
  };

  const handleDateFilterChange = (field, value) => {
    onDateFilterChange({
      ...dateFilter,
      [field]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    onDateFilterChange({
      type: "none",
      year: new Date().getFullYear().toString(),
      month: new Date().getMonth() + 1,
      startDate: "",
      endDate: ""
    });
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || dateFilter.type !== "none";

  const isValidYear = (year) => {
    const yearNum = parseInt(year);
    return !isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 10;
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Filtres avancés</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Filtre par date */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Filtre par date</h4>
          
          {/* Filtre par année */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Par année
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={dateFilter.year}
                onChange={(e) => {
                  handleDateFilterChange('year', e.target.value);
                  handleDateFilterChange('type', e.target.value ? "year" : "none");
                }}
                placeholder="Ex: 2024"
                min="1900"
                max={new Date().getFullYear() + 10}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {dateFilter.year && !isValidYear(dateFilter.year) && (
              <p className="text-red-500 text-xs mt-1">
                Année invalide (1900 - {new Date().getFullYear() + 10})
              </p>
            )}
          </div>

          {/* Filtre par mois */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Par mois
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={dateFilter.year}
                onChange={(e) => {
                  handleDateFilterChange('year', e.target.value);
                  handleDateFilterChange('type', e.target.value ? "month" : "none");
                }}
                placeholder="Année"
                min="1900"
                max={new Date().getFullYear() + 10}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={dateFilter.month}
                onChange={(e) => {
                  handleDateFilterChange('month', e.target.value);
                  handleDateFilterChange('type', e.target.value ? "month" : "none");
                }}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Mois</option>
                <option value="1">Janvier</option>
                <option value="2">Février</option>
                <option value="3">Mars</option>
                <option value="4">Avril</option>
                <option value="5">Mai</option>
                <option value="6">Juin</option>
                <option value="7">Juillet</option>
                <option value="8">Août</option>
                <option value="9">Septembre</option>
                <option value="10">Octobre</option>
                <option value="11">Novembre</option>
                <option value="12">Décembre</option>
              </select>
            </div>
            {dateFilter.year && !isValidYear(dateFilter.year) && (
              <p className="text-red-500 text-xs mt-1">
                Année invalide (1900 - {new Date().getFullYear() + 10})
              </p>
            )}
          </div>

          {/* Filtre par plage de dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Par plage de dates
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => {
                  handleDateFilterChange('startDate', e.target.value);
                  handleDateFilterChange('type', e.target.value ? "range" : "none");
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => {
                  handleDateFilterChange('endDate', e.target.value);
                  handleDateFilterChange('type', e.target.value ? "range" : "none");
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Type de stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de stage
          </label>
          <select
            value={filters.type_stage || ""}
            onChange={(e) => handleFilterChange('type_stage', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les types</option>
            {TYPE_STAGE_OPTIONS.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Direction
          </label>
          <select
            value={filters.direction || ""}
            onChange={(e) => handleFilterChange('direction', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les directions</option>
            {DIRECTION_OPTIONS.map(dir => (
              <option key={dir.value} value={dir.value}>{dir.label}</option>
            ))}
          </select>
        </div>

        {/* Division */}
        {filters.direction && DIVISION_OPTIONS[filters.direction] && DIVISION_OPTIONS[filters.direction].length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Division
            </label>
            <select
              value={filters.division || ""}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les divisions</option>
              {DIVISION_OPTIONS[filters.direction].map(division => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </div>
        )}

        {/* Unité (pour BCR) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unité
          </label>
          <select
            value={filters.unite || ""}
            onChange={(e) => handleFilterChange('unite', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les unités</option>
            {UNITE_OPTIONS.map(unite => (
              <option key={unite} value={unite}>{unite}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        {filters.unite && SERVICE_OPTIONS[filters.unite] && SERVICE_OPTIONS[filters.unite].length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section
            </label>
            <select
              value={filters.service || ""}
              onChange={(e) => handleFilterChange('service', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les sections</option>
              {SERVICE_OPTIONS[filters.unite].map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        )}

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={filters.statut || ""}
            onChange={(e) => handleFilterChange('statut', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

       
        <div className="flex gap-2 pt-2">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}