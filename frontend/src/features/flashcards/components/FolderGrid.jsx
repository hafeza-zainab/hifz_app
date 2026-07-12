import React, { useState } from 'react';
import { renameFolder, deleteFolder } from '../../../shared/services/folderApi';

export default function FolderGrid({ folders, onFolderClick, onCreateFolder, onRefresh }) {
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deletingFolder, setDeletingFolder] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const success = await onCreateFolder(newFolderName.trim(), '#C9A84C');
    if (success) {
      setNewFolderName('');
      setCreating(false);
      onRefresh();
    }
  };

  const handleRename = async (folderId, currentName) => {
    const newName = window.prompt('Enter new folder name:', currentName);
    if (newName && newName.trim() && newName !== currentName) {
      const success = await renameFolder(folderId, newName.trim());
      if (success) onRefresh();
    }
  };

  const handleDelete = async (folderId, folderName) => {
    setDeletingFolder({ id: folderId, name: folderName });
  };

  const confirmDelete = async () => {
    if (!deletingFolder) return;
    const success = await deleteFolder(deletingFolder.id);
    if (success) {
      onRefresh();
    }
    setDeletingFolder(null);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        📁 My Folders
        <button
          onClick={() => setCreating(true)}
          style={{
            marginLeft: 'auto',
            background: '#004D40',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
          data-tour="new-folder-button"
        >
          + New Folder
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => onFolderClick(folder)}
            data-tour="folder-card"
            style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderLeft: `4px solid ${folder.color || '#C9A84C'}`,
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = folder.color || '#C9A84C'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>📁</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {folder.name}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              {folder.set_count || 0} set{folder.set_count !== 1 ? 's' : ''}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRename(folder.id, folder.name);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                opacity: 0.5,
                padding: 4,
              }}
              title="Rename folder"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(folder.id, folder.name);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 32,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                opacity: 0.5,
                padding: 4,
              }}
              title="Delete folder"
            >
              🗑️
            </button>
          </div>
        ))}

        {creating ? (
          <div style={{
            background: '#F9FAFB',
            border: '2px dashed #C9A84C',
            borderRadius: 12,
            padding: 16,
          }} data-tour="folder-name-input">
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 14,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#C9A84C',
                    color: '#111827',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewFolderName('');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#F3F4F6',
                    color: '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✗
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div
            onClick={() => setCreating(true)}
            style={{
              background: '#F9FAFB',
              border: '2px dashed #D1D5DB',
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C9A84C'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
          >
            <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
              + New Folder
            </div>
          </div>
        )}
      </div>

      {deletingFolder && (
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            minWidth: 400,
            maxWidth: 500,
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Delete Folder
            </div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: 24 }}>
              Delete folder "{deletingFolder.name}"? All sets inside will also be permanently deleted. Remove sets from the folder first if you want to keep them.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeletingFolder(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
