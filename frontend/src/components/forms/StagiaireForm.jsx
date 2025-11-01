
import React, { useState } from 'react';
import { User, Mail, School, BookOpen, GraduationCap, Phone, AlertCircle } from 'lucide-react';
import GenericModal from './GenericForm';

const NIVEAU_ETUDE_OPTIONS = ['Bac +2', 'Bac +3', 'Bac +5', 'Bac +8'];

const StagiaireModal = ({
  isOpen,
  onClose,
  formData,
  onSubmit,
  onFormDataChange,
  loading = false,
  error = null
}) => {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    
    const newErrors = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange(name, value);
    
   
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const getInputClassName = (fieldName) => {
    const baseClass = "w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm";
    
    if (errors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50 focus:ring-red-200`;
    }
    return `${baseClass} border-gray-300`;
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier le stagiaire"
      icon={User}
      size="md"
      loading={loading}
    >
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
       
        <div className="grid grid-cols-2 gap-3">
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="nom">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              value={formData.nom}
              onChange={handleChange}
              className={getInputClassName('nom')}
              disabled={loading}
            />
            {errors.nom && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.nom}</span>
              </p>
            )}
          </div>

          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="prenom">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              value={formData.prenom}
              onChange={handleChange}
              className={getInputClassName('prenom')}
              disabled={loading}
            />
            {errors.prenom && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.prenom}</span>
              </p>
            )}
          </div>
        </div>

        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={getInputClassName('email')}
            disabled={loading}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        
        <div className="grid grid-cols-2 gap-3">
       
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="ecole">
              École
            </label>
            <input
              id="ecole"
              name="ecole"
              type="text"
              value={formData.ecole}
              onChange={handleChange}
              className={getInputClassName('ecole')}
              disabled={loading}
            />
          </div>

         
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="specialite">
              Spécialité
            </label>
            <input
              id="specialite"
              name="specialite"
              type="text"
              value={formData.specialite}
              onChange={handleChange}
              className={getInputClassName('specialite')}
              disabled={loading}
            />
          </div>
        </div>

        
        <div className="grid grid-cols-2 gap-3">
      
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="niveau_etude">
              Niveau
            </label>
            <select
              id="niveau_etude"
              name="niveau_etude"
              value={formData.niveau_etude}
              onChange={handleChange}
              className={getInputClassName('niveau_etude').replace('focus:ring-blue-500 focus:border-blue-500', '') + ' focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
              disabled={loading}
            >
              {NIVEAU_ETUDE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

        
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="telephone">
              Téléphone
            </label>
            <input
              id="telephone"
              name="telephone"
              type="text"
              value={formData.telephone}
              onChange={handleChange}
              className={getInputClassName('telephone')}
              disabled={loading}
            />
          </div>
        </div>

        
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center space-x-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Mise à jour...</span>
              </>
            ) : (
              <span>Mettre à jour</span>
            )}
          </button>
        </div>
      </form>
    </GenericModal>
  );
};

export default StagiaireModal;