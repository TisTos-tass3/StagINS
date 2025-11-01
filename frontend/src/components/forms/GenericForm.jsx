import React from 'react';
import { X } from 'lucide-react';

const GenericModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  size = 'md', 
  loading = false
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-transparent/10 animate-backdrop"
    >
     
      <div className={`relative bg-white border border-gray-200 shadow-2xl rounded-xl w-full ${sizeClasses[size] || sizeClasses['md']} mx-4 p-6 animate-fade-in`}>
        
        
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          title="Fermer"
        >
          <X size={22} />
        </button>

       
        <div className="flex items-center mb-6">
          {Icon && <Icon className="text-blue-600 mr-3" size={26} />}
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>

        
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GenericModal;