import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

const SelectionContext = createContext(null);

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection debe usarse dentro de un SelectionProvider');
  }
  return context;
};

export const SelectionProvider = ({ children }) => {
  // Store selected items as objects: { id: joyaObject }
  // This allows us to access full joya data even when item is not on current page
  const [selectedItems, setSelectedItems] = useState({});

  // Helper to get consistent item ID
  const getItemId = useCallback((item) => {
    return item.id ?? item.codigo;
  }, []);

  // Toggle selection for a single item
  // When toggling, we need the full joya object to store
  // If item is already selected, it will be deselected (joya not needed)
  const toggleSelection = useCallback((id, joya) => {
    setSelectedItems((prev) => {
      const newSelection = { ...prev };
      if (newSelection[id]) {
        // Deselect - joya not needed
        delete newSelection[id];
      } else {
        // Select - joya is required
        if (!joya) {
          console.warn('toggleSelection: joya object is required when selecting an item');
          return prev; // Don't update if joya is missing
        }
        newSelection[id] = joya;
      }
      return newSelection;
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedItems({});
  }, []);

  // Check if an item is selected
  const isSelected = useCallback((id) => {
    return !!selectedItems[id];
  }, [selectedItems]);

  // Get count of selected items
  const getSelectionCount = useCallback(() => {
    return Object.keys(selectedItems).length;
  }, [selectedItems]);

  // Get array of selected IDs
  const getSelectedIds = useCallback(() => {
    return Object.keys(selectedItems);
  }, [selectedItems]);

  // Get array of selected joya objects
  const getSelectedItems = useCallback(() => {
    return Object.values(selectedItems);
  }, [selectedItems]);

  // Toggle multiple items (e.g., all items on current page)
  const toggleMultiple = useCallback((items, selected) => {
    setSelectedItems((prev) => {
      const newSelection = { ...prev };
      items.forEach((item) => {
        const id = getItemId(item);
        if (selected) {
          // Select - store full joya object
          newSelection[id] = item;
        } else {
          // Deselect
          delete newSelection[id];
        }
      });
      return newSelection;
    });
  }, [getItemId]);

  const value = useMemo(() => ({
    selectedItems,
    toggleSelection,
    clearSelection,
    isSelected,
    getSelectionCount,
    getSelectedIds,
    getSelectedItems,
    toggleMultiple,
    getItemId
  }), [selectedItems, toggleSelection, clearSelection, isSelected, getSelectionCount, getSelectedIds, getSelectedItems, toggleMultiple, getItemId]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
