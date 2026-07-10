import React, { useState, useEffect } from 'react';
import { getUncategorisedSets, addItemsToFolder } from '../../../shared/services/folderApi';

export default function AddSetsToFolderModal({ folderId, onClose, onSuccess }) {
  const [uncategorisedSets, setUncategorisedSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const loadSets = async () => {
      setLoading(true);
      try {
        const sets = await getUncategorisedSets();
        setUncategorisedSets(sets);
      } catch (e) {
        console.error('[AddSetsToFolderModal] Failed to load uncategorised sets:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSets();
  }, []);

  const handleToggle = (setId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(setId)) {
      newSelected.delete(setId);
    } else {
      newSelected.add(setId);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setAdding(true);
    try {
      const items = Array.from(selectedIds).map(setId => ({
        set_id: setId,
        set_type: 'custom',
      }));
      const success = await addItemsToFolder(folderId, items);
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (e) {
      console.error('[AddSetsToFolderModal] Failed to add sets:', e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2147483647,
    }} data-tour="add-sets-selection-panel">
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        minWidth: 400,
        maxWidth: 500,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }} data-tour="add-sets-to-folder">
          Add Sets to Folder
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
          Only uncategorised sets are shown. Remove a set from its folder first to move it here.
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
            Loading...
          </div>
        ) : uncategorisedSets.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
            No uncategorised sets available
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
            {uncategorisedSets.map((set) => (
              <div
                key={set.id}
                onClick={() => handleToggle(set.id)}
                style={{
                  padding: 12,
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: selectedIds.has(set.id) ? '#F0FDF4' : 'white',
                  borderColor: selectedIds.has(set.id) ? '#BBF7D0' : '#E5E7EB',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(set.id)}
                  onChange={() => handleToggle(set.id)}
                  style={{ width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {set.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    {set.cards_count || 0} cards
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={adding}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: 'white',
              color: '#374151',
              cursor: adding ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || selectedIds.size === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              background: adding || selectedIds.size === 0 ? '#D1D5DB' : '#C9A84C',
              color: '#111827',
              cursor: adding || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {adding ? 'Adding...' : `Add Selected (${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
