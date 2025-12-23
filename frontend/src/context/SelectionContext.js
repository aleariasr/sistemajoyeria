import React, { createContext, useState, useContext, useCallback } from 'react';

const SelectionContext = createContext(null);

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection debe usarse dentro de un SelectionProvider');
  }
  return context;
};

export const SelectionProvider = ({ children }) => {
  // Store selected IDs/codes as an object for O(1) lookup
  const [selectedIds, setSelectedIds] = useState({});

  // Toggle selection for a single item
  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const newSelection = { ...prev };
      if (newSelection[id]) {
        delete newSelection[id];
      } else {
        newSelection[id] = true;
      }
      return newSelection;
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds({});
  }, []);

  // Check if an item is selected
  const isSelected = useCallback((id) => {
    return !!selectedIds[id];
  }, [selectedIds]);

  // Get count of selected items
  const getSelectionCount = useCallback(() => {
    return Object.keys(selectedIds).length;
  }, [selectedIds]);

  // Get array of selected IDs
  const getSelectedIds = useCallback(() => {
    return Object.keys(selectedIds);
  }, [selectedIds]);

  // Toggle multiple items (e.g., all items on current page)
  const toggleMultiple = useCallback((ids, selected) => {
    setSelectedIds((prev) => {
      const newSelection = { ...prev };
      ids.forEach((id) => {
        if (selected) {
          newSelection[id] = true;
        } else {
          delete newSelection[id];
        }
      });
      return newSelection;
    });
  }, []);

  const value = {
    selectedIds,
    toggleSelection,
    clearSelection,
    isSelected,
    getSelectionCount,
    getSelectedIds,
    toggleMultiple
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
