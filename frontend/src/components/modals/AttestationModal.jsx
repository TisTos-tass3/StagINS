import React, { useState } from 'react';
import { Download, FileText, User, Briefcase } from 'lucide-react';
import GenericModal from '../forms/GenericForm';
import { DIRECTION_FULL_NAMES } from '../stageformcomponents/StageConstants';

const AttestationModal = ({ stage, isOpen, onClose, onGenerate }) => {
  const [signataire, setSignataire] = useState('Tassiou ABOUBACAR');
  const [fonctionSignataire, setFonctionSignataire] = useState('Directeur des Ressources Humaines');
  const [format, setFormat] = useState('docx');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!signataire.trim()) {
      alert('Veuillez saisir le nom du signataire');
      return;
    }

    if (!fonctionSignataire.trim()) {
      alert('Veuillez saisir la fonction du signataire');
      return;
    }

    setLoading(true);
    try {
      await onGenerate(stage, signataire, fonctionSignataire, format);
      onClose();
    } catch (error) {
      console.error('Erreur génération attestation:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculerDuree = (debut, fin) => {
    const start = new Date(debut);
    const end = new Date(fin);
    
    let mois = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (end.getDate() >= start.getDate()) {
        mois++;
    }
    
    return Math.max(1, mois);
  };

  
  const formaterDirection = (directionCode) => {
    if (!directionCode) return 'Non spécifiée';
    return DIRECTION_FULL_NAMES[directionCode] || directionCode;
  };

  
 

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title="Générer une attestation de fin de stage"
      icon={FileText}
      size="2xl"
      loading={loading}
    >
      {/* Sous-titre */}
      <p className="text-sm text-gray-600 mb-6 -mt-4">
        Stage: {stage?.theme}
      </p>

      <div className="space-y-6">
        {/* Résumé du stage */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Résumé du stage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Stagiaire:</span>
              <p className="font-medium">
                {stage?.stagiaire?.nom} {stage?.stagiaire?.prenom?.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Type de stage:</span>
              <p className="font-medium">{stage?.type_stage}</p>
            </div>
            <div>
              <span className="text-gray-600">Période:</span>
              <p className="font-medium">
                {stage?.date_debut && new Date(stage.date_debut).toLocaleDateString('fr-FR')} - {stage?.date_fin && new Date(stage.date_fin).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Durée:</span>
              <p className="font-medium">
                {stage?.date_debut && stage?.date_fin ? calculerDuree(stage.date_debut, stage.date_fin) : 'N/A'} mois
              </p>
            </div>
            <div>
              <span className="text-gray-600">Direction:</span>
              <p className="font-medium">
                {stage?.direction ? formaterDirection(stage.direction) : 'Non spécifiée'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Encadrant:</span>
              <p className="font-medium">
                {stage?.encadrant ? `${stage.encadrant.prenom} ${stage.encadrant.nom}` : 'Non assigné'}
              </p>
            </div>
          </div>
        </div>

       
        {/* Configuration de l'attestation */}
        <div className="space-y-4">
         
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>Nom du signataire</span>
            </label>
            <input
              type="text"
              value={signataire}
              onChange={(e) => setSignataire(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Nom du signataire"
              disabled={loading}
            />
          </div>

          
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4" />
              <span>Fonction du signataire</span>
            </label>
            <input
              type="text"
              value={fonctionSignataire}
              onChange={(e) => setFonctionSignataire(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Fonction du signataire"
              disabled={loading}
            />
          </div>

         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format de sortie
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                  Word (.docx)
                
              </label>
             
            </div>
          </div>
        </div>

       
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !signataire.trim() || !fonctionSignataire.trim() }
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Générer l'attestation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export default AttestationModal;