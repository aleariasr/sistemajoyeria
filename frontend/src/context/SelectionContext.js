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

  // Toggle selection for a single item (now requires full joya object)
  const toggleSelection = useCallback((id, joya = null) => {
    setSelectedItems((prev) => {
      const newSelection = { ...prev };
      if (newSelection[id]) {
        // Deselect
        delete newSelection[id];
      } else if (joya) {
        // Select - store full joya object
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
        const id = item.id ?? item.codigo;
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
  }, []);

  const value = useMemo(() => ({
    selectedItems,
    toggleSelection,
    clearSelection,
    isSelected,
    getSelectionCount,
    getSelectedIds,
    getSelectedItems,
    toggleMultiple
  }), [selectedItems, toggleSelection, clearSelection, isSelected, getSelectionCount, getSelectedIds, getSelectedItems, toggleMultiple]);

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
