import React, { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, FileText, X, Check, Download } from "lucide-react";
import { Link } from "react-router-dom";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";

export default function GenericTable({
  data = [],
  columns = [],
  loading = false,
  error = null,
  onEdit = null,
  onDelete = null,
  customActions = [],
  itemsPerPage = 7,
  emptyMessage = "Aucune donnée trouvée.",
  showLink = false,
  linkPath = "",
  linkKey = "id",
  linkLabel = "Consulter le dossier",
  linkBuilder = null,
  onExport = null,
  exportMode = false,
  onExportModeChange = null
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.slice(startIndex, startIndex + itemsPerPage);


  useEffect(() => {
    if (exportMode) {
      setSelectedColumns(columns.map(col => col.key));
    }
  }, [exportMode, columns]);

  const toggleColumnSelection = (columnKey) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };


const resetColumnSelection = () => {
  setSelectedColumns(columns.map(col => col.key));
};

  const handleExportConfirm = () => {
    if (onExport && selectedColumns.length > 0) {
      onExport(selectedColumns);
      if (onExportModeChange) {
        onExportModeChange(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const renderPaginationButtons = () => {
    if (exportMode) return null;

    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md transition-colors ${
            i === currentPage ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
  };

  const confirmDelete = () => {
    if (itemToDelete && onDelete) {
      onDelete(itemToDelete);
      setItemToDelete(null);
    }
  };

  const renderCellContent = (item, column) => {
    const value = item[column.key];
    
    if (showLink && column.key === linkKey) {
      const linkTo = linkBuilder ? linkBuilder(item) : `${linkPath}/${item.id}`;
      return (
        <Link 
          to={linkTo}
          className="text-blue-600 hover:text-blue-800 font-mono font-semibold"
          title={linkLabel}
        >
          {value}
        </Link>
      );
    }

    if (column.isDate) {
      return formatDate(value);
    }

    if (column.render) {
      return column.render(value, item);
    }

    if (column.isStatus && column.statusConfig) {
      const statusClass = column.statusConfig[value] || column.statusConfig.default;
      return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
          {value}
        </span>
      );
    }

    return value || "N/A";
  };

  const renderExportHeader = () => (
    <div className="bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-yellow-800">
            Sélection des colonnes à exporter
          </h3>
          <p className="text-sm text-yellow-600 mt-1">
            Cochez les colonnes que vous souhaitez inclure dans l'export
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetColumnSelection}
            className="px-3 py-2 text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors text-sm"
          >
            Tout sélectionner
          </button>
          <button
            onClick={() => onExportModeChange(false)}
            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleExportConfirm}
            disabled={selectedColumns.length === 0}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Exporter ({selectedColumns.length})
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-10 text-lg text-gray-600">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-lg text-red-600">Erreur : {error.message}</div>;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête d'exportation */}
      {exportMode && renderExportHeader()}
      
      {/* Vue Desktop */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.responsiveClass || ""}`}
                  >
                    {exportMode ? (
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(column.key)}
                          onChange={() => toggleColumnSelection(column.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{column.label}</span>
                      </label>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
                {(onEdit || onDelete || customActions.length > 0) && !exportMode && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (exportMode ? 0 : 1)} className="text-center py-8 text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 ${column.isTruncate ? "max-w-xs truncate" : ""} ${column.responsiveClass || ""}`}
                        title={column.isTruncate ? item[column.key] : undefined}
                      >
                        <div className={`text-sm ${column.isStatus ? "" : "text-gray-900"}`}>
                          {renderCellContent(item, column)}
                        </div>
                      </td>
                    ))}
                    {(onEdit || onDelete || customActions.length > 0) && !exportMode && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {onEdit && (
                            <button
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              onClick={() => onEdit(item)}
                              title="Modifier"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="text-red-600 hover:text-red-800 transition-colors"
                              onClick={() => handleDeleteClick(item)}
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {customActions.map((action, actionIndex) => {
                            const isActive = action.condition ? action.condition(item) : true;
                            const buttonClass = typeof action.className === "function" 
                              ? action.className(item) 
                              : action.className;

                            const buttonTitle = typeof action.title === "function" 
                              ? action.title(item) 
                              : action.title;

                            return (
                              <button
                                key={actionIndex}
                                className={`${buttonClass} transition-colors`}
                                onClick={() => isActive && action.onClick(item)}
                                title={buttonTitle}
                                disabled={!isActive}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vue Mobile */}
      {!exportMode && (
        <div className="md:hidden p-4 space-y-4">
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            currentItems.map((item, index) => (
              <div key={item.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-3">
                  {columns.map((column) => (
                    <div key={column.key} className="flex justify-between">
                      <span className="text-gray-600 font-medium">{column.label}:</span>
                      <span className="text-gray-900 text-right flex-1 ml-2">
                        {renderCellContent(item, column)}
                      </span>
                    </div>
                  ))}
                </div>

                {(onEdit || onDelete || customActions.length > 0) && (
                  <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-gray-200">
                    {onEdit && (
                      <button
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil size={16} className="mr-1" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="flex items-center text-red-600 hover:text-red-800 transition-colors text-sm"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 size={16} className="mr-1" />
                      </button>
                    )}
                    {customActions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors text-sm"
                        onClick={() => action.onClick(item)}
                        disabled={action.condition && !action.condition(item)}
                      >
                        {React.cloneElement(action.icon, { size: 16, className: "mr-1" })}
                        {action.mobileLabel || action.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {data.length > 0 && !exportMode && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <span className="text-sm text-gray-600">
              Page {currentPage} de {totalPages} • {data.length} élément(s) au total
            </span>
            
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm"
              >
                Précédent
              </button>
              
              <div className="flex space-x-1">
                {renderPaginationButtons()}
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        message="Souhaitez-vous vraiment supprimer cet élément ? Cette action est irréversible."
      />
    </div>
  );
}