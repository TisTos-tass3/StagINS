import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Building, 
  CheckCircle, AlertCircle, Loader2 
} from 'lucide-react';
import GenericModal from './GenericForm';

export default function EncadrantModal({ 
  initial, 
  onClose, 
  onSaved, 
  loading: externalLoading 
}) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    institution: 'Interne',
    nom_institution: '', 
    email: '',
    telephone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

   
    if (formData.institution === 'Externe' && !formData.nom_institution.trim()) {
      newErrors.nom_institution = 'Le nom de l\'institution est obligatoire pour un encadrant externe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (initial) {
      setFormData({
        nom: initial.nom || '',
        prenom: initial.prenom || '',
        institution: initial.institution || 'Interne',
        nom_institution: initial.nom_institution || '',  // Nouveau champ
        email: initial.email || '',
        telephone: initial.telephone || ''
      });
    }
  }, [initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

   
    if (name === 'institution' && value === 'Interne') {
      setFormData(prev => ({ ...prev, nom_institution: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const url = initial 
      ? `http://localhost:8000/encadrants/api/${initial.id}/` 
      : 'http://localhost:8000/encadrants/api/create/';
    
    const method = initial ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = "Une erreur inconnue est survenue.";

        if (response.status === 400) {
          if (responseData.email) {
            setErrors(prev => ({ ...prev, email: responseData.email[0] }));
            errorMessage = null;
          } else if (responseData.telephone) {
            setErrors(prev => ({ ...prev, telephone: responseData.telephone[0] }));
            errorMessage = null;
          } else if (responseData.nom_institution) {
            setErrors(prev => ({ ...prev, nom_institution: responseData.nom_institution[0] }));
            errorMessage = null;
          } else if (responseData.form_errors) {
            const formErrors = responseData.form_errors;
            Object.keys(formErrors).forEach(field => {
              setErrors(prev => ({ ...prev, [field]: formErrors[field][0] }));
            });
            errorMessage = null;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          }
        } else if (response.status === 500) {
          errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
        }

        if (errorMessage) {
          setErrors({ submit: errorMessage });
        }
        
        setLoading(false);
        return;
      }

      onSaved(responseData);
    } catch (err) {
      setErrors({ submit: 'Erreur de connexion réseau ou du serveur.' });
      console.error("Erreur d'API:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClass = "w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm";
    
    if (errors[fieldName]) {
      return `${baseClass} border-red-500 bg-red-50 focus:ring-red-200`;
    }
    return `${baseClass} border-gray-300`;
  };

  const isEditMode = !!initial;
  const isLoading = loading || externalLoading;

  return (
    <GenericModal
      isOpen={true}
      onClose={onClose}
      title={isEditMode ? 'Modifier l\'encadrant' : 'Ajouter un encadrant'}
      icon={User}
      size="md"
      loading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom */}
        <div>
          <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span className="text-sm">
                Nom <span className="text-red-500 ml-1">*</span>
              </span>
            </span>
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            value={formData.nom}
            onChange={handleChange}
            disabled={isLoading}
            className={getInputClassName('nom')}
            placeholder="Entrez le nom"
          />
          {errors.nom && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.nom}</span>
            </p>
          )}
        </div>

        {/* Prénom */}
        <div>
          <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center space-x-2">
              <User size={16} className="text-gray-500" />
              <span className="text-sm">
                Prénom <span className="text-red-500 ml-1">*</span>
              </span>
            </span>
          </label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            value={formData.prenom}
            onChange={handleChange}
            disabled={isLoading}
            className={getInputClassName('prenom')}
            placeholder="Entrez le prénom"
          />
          {errors.prenom && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.prenom}</span>
            </p>
          )}
        </div>

        {/* Institution */}
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center space-x-2">
              <Building size={16} className="text-gray-500" />
              <span className="text-sm">
                Institution <span className="text-red-500 ml-1">*</span>
              </span>
            </span>
          </label>
          <select
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            disabled={isLoading}
            className={getInputClassName('institution')}
          >
            <option value="Interne">Interne</option>
            <option value="Externe">Externe</option>
          </select>
        </div>

        {/* Nom de l'institution (conditionnel) */}
        {formData.institution === 'Externe' && (
          <div>
            <label htmlFor="nom_institution" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center space-x-2">
                <Building size={16} className="text-gray-500" />
                <span className="text-sm">
                  Nom de l'institution <span className="text-red-500 ml-1">*</span>
                </span>
              </span>
            </label>
            <input
              id="nom_institution"
              name="nom_institution"
              type="text"
              value={formData.nom_institution}
              onChange={handleChange}
              disabled={isLoading}
              className={getInputClassName('nom_institution')}
              placeholder="Entrez le nom de l'institution externe"
            />
            {errors.nom_institution && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.nom_institution}</span>
              </p>
            )}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center space-x-2">
              <Mail size={16} className="text-gray-500" />
              <span className="text-sm">
                Email <span className="text-red-500 ml-1">*</span>
              </span>
            </span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className={getInputClassName('email')}
            placeholder="exemple@domaine.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center space-x-2">
              <Phone size={16} className="text-gray-500" />
              <span className="text-sm">Téléphone</span>
            </span>
          </label>
          <input
            id="telephone"
            name="telephone"
            type="text"
            value={formData.telephone}
            onChange={handleChange}
            disabled={isLoading}
            className={getInputClassName('telephone')}
            placeholder="Numéro de téléphone (optionnel)"
          />
          {errors.telephone && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.telephone}</span>
            </p>
          )}
        </div>

        {/* Erreur générale */}
        {errors.submit && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-red-700 text-xs">{errors.submit}</span>
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{isEditMode ? 'Sauvegarder' : 'Ajouter'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}