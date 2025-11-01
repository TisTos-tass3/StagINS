
import React from 'react';
import { Clock, FileWarning, AlertTriangle, Info } from 'lucide-react';

export default function AlertesStages({ alertes }) {

  const hasBientotTermines = alertes && (
    alertes.alertes_bientot_termines > 0 || 
    (alertes.liste_alertes_bientot_termines && alertes.liste_alertes_bientot_termines.length > 0) ||
    alertes.stages_bientot_finis > 0
  );

  const hasRetard = alertes && (
    alertes.alertes_retard_rapport > 0 || 
    (alertes.liste_alertes_retard && alertes.liste_alertes_retard.length > 0) ||
    alertes.stages_retard_non_valides > 0
  );





 
  const alertesBientotTermines = alertes.liste_alertes_bientot_termines || [];
  const alertesRetard = alertes.liste_alertes_retard || [];
  
  const countBientotTermines = alertes.alertes_bientot_termines || 
                               alertes.stages_bientot_finis || 
                               alertesBientotTermines.length;
  
  const countRetard = alertes.alertes_retard_rapport || 
                     alertes.stages_retard_non_valides || 
                     alertesRetard.length;

  return (
    <div className="space-y-4 mb-6">
     
      {hasBientotTermines && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            
            <h4 className="font-semibold text-orange-700 text-lg">
              {countBientotTermines} stage(s) se termine(nt) bientôt
            </h4>
          </div>
          
          {alertesBientotTermines.length > 0 ? (
            <div className="space-y-2">
              {alertesBientotTermines.map(stage => (
                <div 
                  key={stage.id} 
                  className="text-orange-700 text-sm p-2 bg-orange-100 rounded-md border border-orange-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium">• {stage.theme}</span>
                      <div className="text-orange-600 mt-1">
                        <span className="block">
                          <strong>Stagiaire:</strong> {stage.stagiaire?.prenom} {stage.stagiaire?.nom}
                        </span>
                        <span className="block">
                          <strong>Matricule:</strong> {stage.stagiaire?.matricule}
                        </span>
                        <span className="block">
                          <strong>Date de fin:</strong> {new Date(stage.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded">
                        {stage.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-700 text-sm">
              {countBientotTermines} stage(s) nécessite(nt) une attention avant leur échéance.
            </p>
          )}
          
         
        </div>
      )}
      
      
      {hasRetard && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <FileWarning className="text-red-600 mr-2" size={20} />
            <h4 className="font-semibold text-red-800 text-lg">
               {countRetard} stage(s) en retard de rapport
            </h4>
          </div>
          
          {alertesRetard.length > 0 ? (
            <div className="space-y-2">
              {alertesRetard.map(stage => {
                const dateFin = new Date(stage.date_fin);
                const aujourdHui = new Date();
                const joursRetard = Math.floor((aujourdHui - dateFin) / (1000 * 60 * 60 * 24));
                
                return (
                  <div 
                    key={stage.id} 
                    className="text-red-700 text-sm p-2 bg-red-100 rounded-md border border-red-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">• {stage.theme}</span>
                        <div className="text-red-600 mt-1">
                          <span className="block">
                            <strong>Stagiaire:</strong> {stage.stagiaire?.prenom} {stage.stagiaire?.nom}
                          </span>
                          <span className="block">
                            <strong>Matricule:</strong> {stage.stagiaire?.matricule}
                          </span>
                          <span className="block">
                            <strong>Terminé depuis:</strong> {joursRetard} jour(s)
                          </span>
                          <span className="block">
                            <strong>Date de fin:</strong> {dateFin.toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                          {stage.statut}
                        </span>
                        <div className="mt-1 text-red-600 text-xs font-semibold">
                          +{joursRetard}j
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-red-700 text-sm">
              {countRetard} stage(s) en attente de rapport depuis plus de 30 jours.
            </p>
          )}
          
          <div className="mt-3 pt-2 border-t border-red-200">
            <p className="text-red-600 text-xs">
              <strong>Action urgente:</strong> Relance immédiate du stagiaire et de l'encadrant.
            </p>
          </div>
        </div>
      )}

     
      
    </div>
  );
}