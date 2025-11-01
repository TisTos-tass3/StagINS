
import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ErrorMessageModal({ message, onClose }) {
  if (!message) return null;

  return (
   <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-transparent/10 animate-backdrop">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-lg font-semibold text-red-700">Erreur</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm">{message}</p>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}