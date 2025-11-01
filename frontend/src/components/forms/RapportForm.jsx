import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertCircle, CloudUpload, FileCheck,
  Download, Loader2, FileText, BookOpen, Upload 
} from 'lucide-react';
import GenericModal from '../forms/GenericForm';


const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return <FileText size={16} className="text-red-500" />;
  if (['doc', 'docx', 'odt'].includes(ext)) return <BookOpen size={16} className="text-blue-500" />;
  return <FileCheck size={16} className="text-gray-500" />;
};

export default function RapportModal({ initial, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    stage: '',
    fichier: null,
  });
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingStages, setLoadingStages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);
  
  
  useEffect(() => {
  
    if (initial) {
      setFormData({
       
        stage: initial.stage?.id ? String(initial.stage.id) : '',
        fichier: null,
      });
    }

    setLoadingStages(true);
    fetch('http://localhost:8000/stages/api/')
      .then(res => res.json())
      .then(data => {
        
        const allowed = data.filter(s => s.statut === 'Terminé' || s.statut === 'Validé');
        setStages(allowed);
        setLoadingStages(false);
      })
      .catch(() => { setLoadingStages(false); });
  }, [initial]);

 
  const handleChange = (e) => {
    const { name, value } = e.target;
   
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (file) => {
    setFormData(prev => ({ ...prev, fichier: file }));
    if (errors.fichier) setErrors(prev => ({ ...prev, fichier: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.stage) newErrors.stage = "Veuillez sélectionner un stage.";
    if (!formData.fichier && !initial) newErrors.fichier = "Veuillez fournir un fichier.";
    if (formData.fichier && formData.fichier.size > 15 * 1024 * 1024) newErrors.fichier = "Fichier trop volumineux (max 15 Mo).";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  
  setLoading(true);
  setErrors({});

  const form = new FormData();
  
  
  form.append('stage', formData.stage); 
  
  if (formData.fichier) {
    form.append('fichier', formData.fichier);
  }

  const url = initial ? 
      `http://localhost:8000/rapports/api/${initial.id}/` : 
      'http://localhost:8000/rapports/api/create/';
  const method = initial ? 'PUT' : 'POST';

  try {
      const response = await fetch(url, { 
          method, 
          body: form 
     });
      
      let data = {};
      const text = await response.text();
      try {
          data = JSON.parse(text);
      } catch (e) {
        
          if (!response.ok) {
              throw new Error("Réponse serveur non-JSON ou erreur critique.");
          }
      }

      if (response.ok) {
          onSaved(data);
          onClose(); 
      } else {
         
          const fieldErrors = {};
          let generalError = '';
          
         
          const errorsData = data.form_errors || data; // Adapte selon le format de l'erreur Django
          
          if (errorsData) {
              Object.keys(errorsData).forEach(field => {
                  const errorMessages = Array.isArray(errorsData[field]) ? errorsData[field].join(', ') : errorsData[field];
                  if (field === '__all__' || field === 'non_field_errors') {
                      generalError = errorMessages;
                  } else {
                      fieldErrors[field] = errorMessages;
                  }
              });
          }
          
          setErrors({ 
              ...fieldErrors,
              submit: generalError || `Échec de la sauvegarde (Statut ${response.status}).`
          });
      }
  } catch (e) {
      console.error(e);
      setErrors({ submit: e.message || 'Erreur de connexion réseau ou du serveur.' });
  } finally {
      setLoading(false);
  }
};


  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <GenericModal
      isOpen={true}
      onClose={onClose}
      title={initial ? 'Modifier le rapport' : 'Déposer un rapport'}
      icon={CloudUpload}
      size="md"
      loading={loading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
       
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
            Stage associé <span className="text-red-500">*</span>
          </label>
          <select
            id="stage"
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            disabled={loading || loadingStages}
            className={`w-full p-2 border ${errors.stage ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm`}
          >
            <option value="">{loadingStages ? 'Chargement des stages...' : '-- Sélectionner un stage terminé/validé --'}</option>
            {stages.map(s => (
              <option key={s.id} value={s.id}>
                {s.theme} — {s.stagiaire?.prenom || '??'} {s.stagiaire?.nom || ''} ({s.statut})
              </option>
            ))}
          </select>
          {errors.stage && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.stage}</span>
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fichier du rapport {!initial && <span className="text-red-500">*</span>}
          </label>
          <div 
            className={`border-2 ${dragActive ? 'border-blue-500 bg-blue-50' : errors.fichier ? 'border-red-500 bg-red-50' : 'border-dashed border-gray-300'} rounded-lg p-4 text-center transition-all`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="fichier" 
              name="fichier"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
              accept=".pdf,.doc,.docx,.odt"
            />
            
            {formData.fichier ? (
              <div className="flex items-center justify-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                {getFileIcon(formData.fichier.name)}
                <span className="text-sm font-medium text-blue-700 truncate">{formData.fichier.name}</span>
                <button 
                  type="button" 
                  onClick={() => handleFileChange(null)} 
                  className="text-red-400 hover:text-red-600 ml-2"
                  disabled={loading}
                >
                 
                </button>
              </div>
            ) : (
              <>
                <CloudUpload size={32} className="mx-auto text-blue-400 mb-2" />
                <p className="text-gray-600 text-sm mb-2">
                  Glissez et déposez votre fichier ici, ou
                </p>
                <button 
                  type="button" 
                  onClick={handleFileButtonClick}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Sélectionner un fichier
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Formats acceptés : PDF, DOC, DOCX, ODT. Max : 15 Mo.
                </p>
              </>
            )}
          </div>
          {errors.fichier && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.fichier}</span>
            </p>
          )}
          
         
          {initial && !formData.fichier && (
            <div className="mt-2 text-xs text-gray-500">
              Fichier actuel : 
              <a 
                href={initial.fichier_url} 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 hover:underline ml-1 flex items-center justify-center"
              >
                <Download size={12} className="mr-1" />
                Télécharger
              </a>
            </div>
          )}
        </div>


        
        {errors.submit && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-red-700 text-xs">{errors.submit}</span>
          </div>
        )}

        
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{initial ? 'Sauvegarder' : 'Déposer'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </GenericModal>
  );
}