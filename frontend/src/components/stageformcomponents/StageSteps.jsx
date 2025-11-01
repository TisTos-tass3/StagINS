// StageSteps.jsx - Modifications dans StageInfoStep

import React from "react";
import SearchableSelect from "../SearchableSelect";
import { 
  FileText, Calendar, Loader2, 
  User, CheckCircle, AlertCircle, 
  BookOpen, MapPin, Upload, FileCheck, X, CloudUpload 
} from "lucide-react";
import { 
  NIVEAU_ETUDE_OPTIONS, 
  TYPE_STAGE_OPTIONS, 
  UNITE_OPTIONS,
  SERVICE_OPTIONS,
  DIRECTION_OPTIONS,
  DIVISION_OPTIONS
} from "../stageformcomponents/StageConstants";


const getInputClassName = (errors, fieldName) => {
  const baseClass = "w-full p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm";
  return errors[fieldName] ? `${baseClass} border-red-500 bg-red-50 focus:ring-red-200` : `${baseClass} border-gray-300`;
};


 {/*Étape 1 : Informations du Stagiaire */}


export function StagiaireStep({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  handleStagiaireChoiceChange, 
  stagiaireChoice, 
  stagiaireOptions, 
  searchLoading, 
  errors, 
  handleNextStep,
  loading
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-300 pb-4">
        <h4 className="text-lg font-semibold text-gray-800">Étape 1/2: Informations du Stagiaire</h4>
      </div>
      
      {/* Choix du type de stagiaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Type de stagiaire</label>
        <div className="flex space-x-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="stagiaireChoice"
              value="new"
              checked={stagiaireChoice === 'new'}
              onChange={(e) => handleStagiaireChoiceChange(e.target.value)}
              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            Nouveau stagiaire
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="stagiaireChoice"
              value="existing"
              checked={stagiaireChoice === 'existing'}
              onChange={(e) => handleStagiaireChoiceChange(e.target.value)}
              className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            Stagiaire existant
          </label>
        </div>
      </div>

      {/* Nouveau stagiaire */}
      {stagiaireChoice === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'nom')}
            />
            {errors.nom && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.nom}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'prenom')}
            />
            {errors.prenom && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.prenom}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              className={getInputClassName(errors, 'email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'telephone')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              École
            </label>
            <input
              name="ecole"
              value={formData.ecole}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'ecole')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spécialité
            </label>
            <input
              name="specialite"
              value={formData.specialite}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'specialite')}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="niveau_etude" className="block text-sm font-medium text-gray-700 mb-1">
              Niveau d'étude
            </label>
            <select
              name="niveau_etude"
              value={formData.niveau_etude}
              onChange={handleChange}
              className={getInputClassName(errors, 'niveau_etude')}
            >
              {NIVEAU_ETUDE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stagiaire existant */}
      {stagiaireChoice === 'existing' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un stagiaire existant <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={stagiaireOptions}
              value={formData.existingStagiaire}
              onChange={(value) => handleSelectChange('existingStagiaire', value)}
              placeholder="Rechercher un stagiaire..."
              loading={searchLoading}
              className={errors.existingStagiaire ? 'border-red-500 bg-red-50' : ''}
            />
            {errors.existingStagiaire && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.existingStagiaire}</span>
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-800 mb-3 text-sm">Mettre à jour les informations académiques</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  École
                </label>
                <input
                  name="ecole"
                  value={formData.ecole}
                  onChange={handleChange}
                  type="text"
                  className={getInputClassName(errors, 'ecole')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité
                </label>
                <input
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  type="text"
                  className={getInputClassName(errors, 'specialite')}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="niveau_etude" className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'étude
                </label>
                <select
                  name="niveau_etude"
                  value={formData.niveau_etude}
                  onChange={handleChange}
                  className={getInputClassName(errors, 'niveau_etude')}
                >
                  {NIVEAU_ETUDE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleNextStep}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}


 {/*Étape 2 : Informations du Stage */}

export function StageInfoStep({
  formData,
  handleChange,
  handleSelectChange,
  handleFileChange,
  handleDecisionChange,
  handleSubmit,
  handlePreviousStep,
  onClose,
  isEditMode,
  availableServices,
  encadrantOptions,
  stagiaireOptions,
  searchLoading,
  errors,
  loading,
  lettreFileName,
  setLettreFileName,
  fileInputRef,
  dragActive,
  handleDrag,
  handleDrop,
  handleFileButtonClick,
  submitButtonText,
  
  availableDivisions = [],
  availableBcrServices = []
}) {
  
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FileText size={16} className="text-red-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <FileText size={16} className="text-green-500" />;
    return <FileCheck size={16} className="text-gray-500" />;
  };
  
  const handleRemoveFile = () => {
    handleFileChange({ target: { files: [] } });
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    setLettreFileName("");
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h4 className="text-lg font-semibold text-gray-800">
          {isEditMode ? "Informations du Stage" : "Étape 2/2: Informations du Stage"}
        </h4>
      </div>

      <div className="space-y-4">
        {/*Champ Direction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction <span className="text-red-500">*</span>
            </label>
            <select
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className={getInputClassName(errors, 'direction')}
            >
              <option value="">Sélectionner une direction</option>
              {DIRECTION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.direction && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.direction}</span>
              </p>
            )}
          </div>

          {/* Champ conditionnel: Division (pour non-BCR) */}
          {formData.direction && formData.direction !== 'BCR' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division 
              </label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className={getInputClassName('division')}
              >
                <option value="">Sélectionner une division</option>
                {availableDivisions.map(division => (
                  <option key={division} value={division}>
                    {division}
                  </option>
                ))}
              </select>
               {errors.division && (
    <p className="mt-1 text-sm text-red-600">{errors.division}</p>
  )}
            </div>
          )}

          {/* Champs BCR: Unité et Section */}
          {formData.direction === 'BCR' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unité <span className="text-red-500">*</span>
                </label>
                <select
                  name="unite"
                  value={formData.unite}
                  onChange={handleChange}
                  className={getInputClassName(errors, 'unite')}
                >
                  <option value="">Sélectionner une unité</option>
                  {UNITE_OPTIONS.map(unite => (
                    <option key={unite} value={unite}>
                      {unite}
                    </option>
                  ))}
                </select>
                {errors.unite && (
                  <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle size={12} />
                    <span>{errors.unite}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className={getInputClassName(errors, 'service')}
                  disabled={!formData.unite}
                >
                  <option value="">Sélectionner une section</option>
                  {availableBcrServices.map(service => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {!formData.unite && (
                  <p className="mt-1 text-xs text-gray-500">
                    Sélectionnez d'abord une unité
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Champs existants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thème <span className="text-red-500">*</span>
            </label>
            <input
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              type="text"
              className={getInputClassName(errors, 'theme')}
            />
            {errors.theme && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.theme}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="type_stage" className="block text-sm font-medium text-gray-700 mb-1">
              Type de Stage <span className="text-red-500">*</span>
            </label>
            <select
              name="type_stage"
              value={formData.type_stage}
              onChange={handleChange}
              className={getInputClassName(errors, 'type_stage')}
            >
              {TYPE_STAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de Début <span className="text-red-500">*</span>
            </label>
            <input
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              type="date"
              className={getInputClassName(errors, 'date_debut')}
            />
            {errors.date_debut && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.date_debut}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de Fin <span className="text-red-500">*</span>
            </label>
            <input
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              type="date"
              className={getInputClassName(errors, 'date_fin')}
            />
            {errors.date_fin && (
              <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>{errors.date_fin}</span>
              </p>
            )}
          </div>

          {/* Encadrant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encadrant 
            </label>
            <SearchableSelect
              options={encadrantOptions}
              value={formData.encadrant}
              onChange={(value) => handleSelectChange('encadrant', value)}
              placeholder="Rechercher un encadrant..."
              loading={searchLoading}
              className={errors.encadrant ? 'border-red-500 bg-red-50' : ''}
            />
          </div>

          {/* Stagiaire édition (uniquement en mode édition) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stagiaire <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={stagiaireOptions}
                value={formData.stagiaire}
                onChange={(value) => handleSelectChange('stagiaire', value)}
                placeholder="Rechercher un stagiaire..."
                loading={searchLoading}
                className={errors.stagiaire ? 'border-red-500 bg-red-50' : ''}
              />
              {errors.stagiaire && (
                <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{errors.stagiaire}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Décision */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de décision
          </label>
          <input
            name="decision"
            value={formData.decision}
            onChange={handleDecisionChange}
            type="text"
            className={getInputClassName(errors, 'decision')}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                const selectionStart = e.target.selectionStart;
                if (selectionStart <= 2) {
                  e.preventDefault();
                }
              }
            }}
            onFocus={(e) => {
              if (e.target.value === "N° ME/F/INS/DG/DRH/DGCFC") {
                e.target.setSelectionRange(3, 3);
              }
            }}
          />
          <p className="mt-1 text-xs text-gray-500">
            ex: N°12345ME/F/INS/DG/DRH/DGCFC
          </p>
        </div>

        {/* Lettre d'acceptation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lettre d'acceptation scannée
          </label>
          
          <div 
            className={`border-2 ${dragActive ? 'border-blue-500 bg-blue-50' : errors.lettre_acceptation ? 'border-red-500 bg-red-50' : 'border-dashed border-gray-300'} rounded-lg p-4 text-center transition-all`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="lettre_acceptation" 
              name="lettre_acceptation"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            
            {lettreFileName ? (
              <div className="flex items-center justify-center space-x-2">
                {getFileIcon(lettreFileName)}
                <span className="text-sm font-medium text-gray-700">{lettreFileName}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <CloudUpload size={32} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez votre fichier ici ou{" "}
                  <button
                    type="button"
                    onClick={handleFileButtonClick}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    parcourez
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Formats acceptés: PDF, JPG, PNG (max 10 Mo)
                </p>
              </div>
            )}
          </div>
          
          {errors.lettre_acceptation && (
            <p className="mt-1 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle size={12} />
              <span>{errors.lettre_acceptation}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        {!isEditMode && (
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Précédent
          </button>
        )}
        
        <div className="flex space-x-3 ml-auto">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Chargement...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{submitButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}