import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message = "Êtes-vous sûr de vouloir supprimer cet élément ?" 
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-transparent/10 animate-backdrop"
    >
      {/* Fenêtre principale */}
      <div className="relative bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-md p-8 animate-fade-in">
        
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Fermer"
        >
          <X size={22} />
        </button>

       
        <div className="flex items-center mb-5">
          <AlertTriangle className="text-red-500 mr-3" size={26} />
          <h2 className="text-xl font-semibold text-gray-800">Confirmation</h2>
        </div>

        
        <p className="text-gray-600 mb-8 text-base leading-relaxed">
          {message}
        </p>

        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
