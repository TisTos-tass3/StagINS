
import React, { useState } from 'react';
import { Search, Key, User, ArrowRight, AlertCircle } from 'lucide-react';
import GenericModal from '../forms/GenericForm';

const SearchModal = ({ isOpen, onClose }) => {
  const [matriculeSearch, setMatriculeSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [errors, setErrors] = useState({});

  const resetSearchModal = () => {
    setMatriculeSearch('');
    setSearchResult(null);
    setSearchError(null);
    setSearchLoading(false);
    setErrors({});
  };

  const handleMatriculeSearch = () => {
    
    const newErrors = {};

    if (!matriculeSearch.trim()) newErrors.matricule = 'Veuillez entrer un matricule';

    setErrors(newErrors);

    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    fetch(`http://localhost:8000/stagiaires/api/search-by-matricule/?matricule=${encodeURIComponent(matriculeSearch)}`)
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || 'Erreur lors de la recherche'); 
          });
        }
        return response.json();
      })
      .then(data => {
        setSearchResult(data);
        setSearchLoading(false);
      })
      .catch(err => {
        setSearchError(err.message);
        setSearchLoading(false);
        console.error("Erreur lors de la recherche par matricule:", err);
      });
  };

  const handleMatriculeChange = (e) => {
    const value = e.target.value;
    setMatriculeSearch(value);
    
    
    if (errors.matricule) {
      setErrors(prev => ({ ...prev, matricule: null }));
    }
  };

  const goToStagiaireDetail = (stagiaireId) => {
    navigate(`/stagiaires/api/${stagiaireId}/detail/`);
  };

  const handleClose = () => {
    resetSearchModal();
    onClose();
  };

  const getInputClassName = () => {
    const baseClass = "w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
    
    if (errors.matricule) {
      return `${baseClass} border-red-500 bg-red-50 focus:ring-red-200`;
    }
    return `${baseClass} border-gray-300`;
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recherche par matricule"
      icon={User}
      size="sm"
      loading={searchLoading}
    >
      <div className="space-y-4">
        
        <div className="space-y-4 mb-4">
            <h1 className="block text-xs font-medium text-gray-500">Entrez le matricule exact d'un stagiaire pour accéder à son dossier complet, y compris les stagiaires archivés.</h1>
          </div>
          
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Matricule <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="STG-20241201-123"
              value={matriculeSearch}
              onChange={handleMatriculeChange}
              onKeyPress={(e) => e.key === 'Enter' && handleMatriculeSearch()}
              className={getInputClassName()}
              disabled={searchLoading}
            />
          </div>
          {errors.matricule && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.matricule}</span>
            </p>
          )}
        </div>

       
        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{searchError}</p>
          </div>
        )}

       
        {searchResult && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h4 className="font-medium text-green-800 text-sm">Stagiaire trouvé</h4>
                <p className="text-green-700 text-xs">
                  {searchResult.nom} {searchResult.prenom}
                </p>
                <p className="text-green-600 text-xs">
                  {searchResult.matricule}
                </p>
              </div>
              <button
                onClick={() => {
                  console.log("Navigation vers:", `/stagiaires/api/${searchResult.id}/detail/`);
                  window.location.href = `/stagiaires/api/${searchResult.id}/detail/`;
                }}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Voir dossier
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

       
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={searchLoading}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            Fermer
          </button>
          <button
            onClick={handleMatriculeSearch}
            disabled={searchLoading}
            className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {searchLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Rechercher</span>
              </>
            )}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export default SearchModal;