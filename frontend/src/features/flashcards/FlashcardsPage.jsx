// C:\quran-similarity-app\frontend\src\features\flashcards\FlashcardsPage.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import StudyView from './components/StudyView';
import TestView from './components/TestView';
import { flashcardsData } from './data/flashcardsData';
import CreateFlashcardModal from './components/CreateFlashcardModal';
import FolderGrid from './components/FolderGrid';
import AddSetsToFolderModal from './components/AddSetsToFolderModal';
import { authFetch } from '../../shared/services/http';
import { useTour } from '../../shared/context/TourContext';
import { getFolders, createFolder, removeItemFromFolder } from '../../shared/services/folderApi';

const SequenceFlowchart = lazy(() => import('./components/SequenceFlowchart'));

// ─── User Set Viewer ───────────────────────────────────────────────────────────
function UserSetViewer({ set, onBack, onDelete, onRenameSuccess }) {
  const { dispatchTourEvent } = useTour();
  const [mode, setMode]               = useState('study');
  const [loading, setLoading]         = useState(true);
  const [cards, setCards]             = useState([]);
  const [cardIndex, setCardIndex]     = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [deleting, setDeleting]       = useState(false);
  // Fix: confirmDelete must be component-level state, not declared inside handleDelete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming]       = useState(false);
  const [newName, setNewName]         = useState(set.name);
  const [renameSaving, setRenameSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCards = async () => {
      console.log('[UserSetViewer] Fetching cards for set ID:', set.id, 'set name:', set.name);
      try {
        const res = await authFetch(`/flashcards/user-sets/${set.id}`, {}, 'fetchCards');
        if (!cancelled && res?.success) {
          const loadedCards = res.data.cards || [];
          console.log('[RENDER QUESTIONS] Loaded cards for set:', res.data.name, loadedCards.length, loadedCards.map(c => c.front));
          setCards(loadedCards);
        }
      } catch (e) {
        console.error('[FlashcardsPage] Failed to load cards for set:', set.id, e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCards();
    return () => { cancelled = true; };
  }, [set.id, set.name]);

  // First click arms the confirmation; second click deletes.
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await authFetch(`/flashcards/user-sets/${set.id}`, { method: 'DELETE' }, 'deleteUserSet');
      onDelete(set.id);
    } catch (e) {
      console.error('[FlashcardsPage] Failed to delete set:', set.id, e);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === set.name) {
      setRenaming(false);
      setNewName(set.name);
      return;
    }
    setRenameSaving(true);
    try {
      const res = await authFetch(
        `/flashcards/user-sets/${set.id}`,
        { method: 'PATCH', body: JSON.stringify({ name: newName }) },
        'renameUserSet'
      );
      if (res?.success) {
        if (onRenameSuccess) onRenameSuccess(set.id, newName);
        setRenaming(false);
      } else {
        console.error('[FlashcardsPage] Rename failed for set:', set.id, res);
        setNewName(set.name);
        setRenaming(false);
      }
    } catch (e) {
      console.error('[FlashcardsPage] Rename error for set:', set.id, e);
      setNewName(set.name);
      setRenaming(false);
    } finally {
      setRenameSaving(false);
    }
  };

  return (
    <div className="flashcards-main-content">
      {/* Back + title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back
          </button>

          {renaming ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  { e.preventDefault(); handleRename(); }
                if (e.key === 'Escape') { setRenaming(false); setNewName(set.name); }
              }}
              onBlur={() => {
                if (!renameSaving) { setRenaming(false); setNewName(set.name); }
              }}
              disabled={renameSaving}
              style={{ fontSize: 16, fontWeight: 600, border: '2px solid #004D40', borderRadius: 6, padding: '4px 12px', outline: 'none', width: 300 }}
            />
          ) : (
            <h1 style={{ margin: 0, fontSize: 22, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
              {set.name}
              <button
                onClick={() => { setRenaming(true); setNewName(set.name); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9CA3AF', padding: 0 }}
                title="Rename set"
                data-tour="flashcard-rename"
              >
                ✏️
              </button>
            </h1>
          )}
        </div>

        {/* Delete button — first press shows confirmation text, second press deletes */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          onMouseLeave={() => { if (!deleting) setConfirmDelete(false); }}
          data-tour="flashcard-actions"
          style={{
            background: confirmDelete ? '#DC2626' : '#FEF2F2',
            border: `1px solid ${confirmDelete ? '#DC2626' : '#FECACA'}`,
            borderRadius: 8,
            padding: '6px 14px',
            cursor: deleting ? 'not-allowed' : 'pointer',
            fontSize: 13,
            color: confirmDelete ? '#fff' : '#DC2626',
            fontWeight: 600,
            transition: 'all .15s',
          }}
        >
          {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete?' : '🗑 Delete Set'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading cards…</div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>No cards found.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }} data-tour="flashcard-study-view">
            <button
              onClick={() => { setMode('study'); setCardIndex(0); setFlipped(false); }}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: mode === 'study' ? '#004D40' : '#F3F4F6', color: mode === 'study' ? '#fff' : '#111827' }}
            >
              📖 Study
            </button>
            <button
              onClick={() => {
                setMode('test');
                setCardIndex(0);
                setFlipped(false);
                try {
                  dispatchTourEvent('flashcard:test:opened');
                } catch (e) {
                  console.error('[FlashcardsPage] Error dispatching tour event:', e);
                }
              }}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: mode === 'test' ? '#004D40' : '#F3F4F6', color: mode === 'test' ? '#fff' : '#111827' }}
              data-tour="test-yourself-tab"
            >
              🧠 Test Yourself
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', alignSelf: 'center' }}>
              {cards.length} card{cards.length !== 1 ? 's' : ''}
            </span>
          </div>

          {mode === 'study' && (
            <Suspense fallback={<div style={{ textAlign: 'center', padding: 20, color: '#9CA3AF' }}>Loading sequence flowchart...</div>}>
              <SequenceFlowchart setName={set.name} cards={cards} />
            </Suspense>
          )}

          {mode === 'study' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cards.map((card, i) => (
                <div key={card.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '12px 16px', background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', fontSize: 13, fontWeight: 700, color: '#065F46', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#004D40', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                      {i + 1}
                    </span>
                    {card.front}
                  </div>
                  <div style={{ padding: '12px 16px', fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line', direction: 'rtl', textAlign: 'right', fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                    {card.back}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                Card {cardIndex + 1} of {cards.length}
              </div>
              <div
                onClick={() => setFlipped((f) => !f)}
                style={{
                  width: '100%', maxWidth: 520, minHeight: 200, borderRadius: 16,
                  background: flipped ? '#004D40' : 'white',
                  border: '2px solid #004D40', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '28px 32px', textAlign: 'center', transition: 'background .25s',
                  boxShadow: '0 4px 20px rgba(0,77,64,0.12)',
                }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12, color: flipped ? 'rgba(255,255,255,.55)' : '#9CA3AF' }}>
                    {flipped ? 'ANSWER' : 'QUESTION'}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: flipped ? '#fff' : '#111827', lineHeight: 1.6, whiteSpace: 'pre-line', direction: flipped ? 'rtl' : 'ltr', fontFamily: flipped ? "'Traditional Arabic', 'Amiri', serif" : 'inherit' }}>
                    {flipped ? cards[cardIndex].back : cards[cardIndex].front}
                  </div>
                  {!flipped && (
                    <div style={{ marginTop: 16, fontSize: 12, color: '#9CA3AF' }}>
                      Click to reveal answer
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { setCardIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
                  disabled={cardIndex === 0}
                  style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: cardIndex === 0 ? 'not-allowed' : 'pointer', color: '#374151', fontWeight: 600, fontSize: 13 }}>
                  ← Prev
                </button>
                <button
                  onClick={() => { setCardIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
                  disabled={cardIndex === cards.length - 1}
                  style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#004D40', cursor: cardIndex === cards.length - 1 ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 600, fontSize: 13 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const navigate = useNavigate();
  const { isActive, currentStep, onModalOpened, onSetCreated, onSetOpened, dispatchTourEvent } = useTour();
  const [selectedCategory, setSelectedCategory] = useState(flashcardsData[0].id);
  const [mode, setMode]                         = useState('study');
  const [userSets, setUserSets]                 = useState([]);
  const [setsLoading, setSetsLoading]           = useState(true);
  const [activeUserSet, setActiveUserSet]       = useState(null);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [previousSetCount, setPreviousSetCount] = useState(0);
  
  // Folder system state (new file system approach)
  const [folders, setFolders]                   = useState([]);
  const [foldersLoading, setFoldersLoading]   = useState(true);
  const [currentFolderId, setCurrentFolderId]   = useState(null); // null = main view
  const [folderSets, setFolderSets]             = useState([]);
  const [uncategorisedSets, setUncategorisedSets] = useState([]);
  const [showAddSetsModal, setShowAddSetsModal] = useState(false);

  const activeCategory = flashcardsData.find((c) => c.id === selectedCategory);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await authFetch('/flashcards/user-sets', {}, 'loadUserSets');
        if (!cancelled && res?.success) setUserSets(res.data || []);
      } catch (e) {
        console.error('[FlashcardsPage] Failed to load user sets:', e);
      } finally {
        if (!cancelled) setSetsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Load folders
  useEffect(() => {
    let cancelled = false;
    const loadFolders = async () => {
      try {
        const data = await getFolders();
        if (!cancelled) setFolders(data);
      } catch (e) {
        console.error('[FlashcardsPage] Failed to load folders:', e);
      } finally {
        if (!cancelled) setFoldersLoading(false);
      }
    };
    loadFolders();
    return () => { cancelled = true; };
  }, []);

  // Load uncategorised sets (main view)
  useEffect(() => {
    if (currentFolderId !== null) return; // Only load in main view
    let cancelled = false;
    const loadUncategorised = async () => {
      try {
        const res = await authFetch('/flashcards/user-sets/uncategorised', {}, 'loadUncategorisedSets');
        if (!cancelled && res?.success) {
          const unique = Array.from(new Map((res.data || []).map(s => [s.id, s])).values());
          setUncategorisedSets(unique);
        } else {
          console.warn('[FlashcardsPage] Could not load uncategorised sets, falling back to all sets:', res?.message || 'Unknown error');
          // FALLBACK: load ALL user sets and filter out those in any folder
          try {
            const [setsRes, foldersRes] = await Promise.all([
              authFetch('/flashcards/user-sets', {}, 'loadAllSetsFallback'),
              authFetch('/flashcards/folders', {}, 'loadFoldersFallback')
            ]);
            const allSets = setsRes?.data || [];
            const folders = foldersRes?.data || [];
            // Collect all set IDs that are in folders
            const folderSetIds = new Set();
            for (const folder of folders) {
              const folderSetsRes = await authFetch(`/flashcards/folders/${folder.id}/sets`, {}, `loadFolderSets_${folder.id}`);
              if (folderSetsRes?.data) {
                folderSetsRes.data.forEach(s => folderSetIds.add(s.id));
              }
            }
            const uncategorised = allSets.filter(s => !folderSetIds.has(s.id));
            const unique = Array.from(new Map(uncategorised.map(s => [s.id, s])).values());
            setUncategorisedSets(unique);
          } catch (fallbackErr) {
            console.error('[FlashcardsPage] Fallback also failed:', fallbackErr);
            setUncategorisedSets([]);
          }
        }
      } catch (err) {
        console.error('[FlashcardsPage] Could not load uncategorised sets, falling back to all sets:', err);
        // FALLBACK: load ALL user sets and filter out those in any folder
        try {
          const [setsRes, foldersRes] = await Promise.all([
            authFetch('/flashcards/user-sets', {}, 'loadAllSetsFallback'),
            authFetch('/flashcards/folders', {}, 'loadFoldersFallback')
          ]);
          const allSets = setsRes?.data || [];
          const folders = foldersRes?.data || [];
          // Collect all set IDs that are in folders
          const folderSetIds = new Set();
          for (const folder of folders) {
            const folderSetsRes = await authFetch(`/flashcards/folders/${folder.id}/sets`, {}, `loadFolderSets_${folder.id}`);
            if (folderSetsRes?.data) {
              folderSetsRes.data.forEach(s => folderSetIds.add(s.id));
            }
          }
          const uncategorised = allSets.filter(s => !folderSetIds.has(s.id));
          const unique = Array.from(new Map(uncategorised.map(s => [s.id, s])).values());
          setUncategorisedSets(unique);
        } catch (fallbackErr) {
          console.error('[FlashcardsPage] Fallback also failed:', fallbackErr);
          setUncategorisedSets([]);
        }
      }
    };
    loadUncategorised();
    return () => { cancelled = true; };
  }, [currentFolderId]);

  // Load folder sets when a folder is selected
  useEffect(() => {
    if (currentFolderId === null) {
      setFolderSets([]);
      return;
    }
    let cancelled = false;
    const loadFolderSets = async () => {
      try {
        const res = await authFetch(`/flashcards/folders/${currentFolderId}/sets`, {}, 'loadFolderSets');
        if (!cancelled && res?.success) setFolderSets(res.data || []);
      } catch (e) {
        console.error('[FlashcardsPage] Failed to load folder sets:', e);
      }
    };
    loadFolderSets();
    return () => { cancelled = true; };
  }, [currentFolderId]);

  // Track when modal opens for tour step 4
  useEffect(() => {
    if (isActive && currentStep === 4 && showCreateModal) {
      onModalOpened();
    }
  }, [isActive, currentStep, showCreateModal, onModalOpened]);

  // Track when set is created for tour step 5
  useEffect(() => {
    if (isActive && currentStep === 5 && userSets.length > previousSetCount) {
      onSetCreated();
    }
    setPreviousSetCount(userSets.length);
  }, [isActive, currentStep, userSets.length, previousSetCount, onSetCreated]);

  // Track when set is opened for tour step 6
  const handleSetClick = (set) => {
    setActiveUserSet(set);
    try {
      dispatchTourEvent('flashcard:opened');
    } catch (e) {
      console.error('[FlashcardsPage] Error dispatching tour event:', e);
    }
    if (isActive && currentStep === 6) {
      onSetOpened();
    }
  };

  const refreshUserSets = async () => {
    setSetsLoading(true);
    try {
      const res = await authFetch('/flashcards/user-sets', {}, 'refreshUserSets');
      if (res?.success) {
        const newSets = res.data || [];
        // Check if a new set was created (count increased)
        if (newSets.length > userSets.length) {
          try {
            dispatchTourEvent('flashcard:created');
          } catch (e) {
            console.error('[FlashcardsPage] Error dispatching tour event:', e);
          }
        }
        setUserSets(newSets);
        // Also refresh uncategorised sets if in main view
        if (currentFolderId === null) {
          const uncategorisedRes = await authFetch('/flashcards/user-sets/uncategorised', {}, 'refreshUncategorisedSets');
          if (uncategorisedRes?.success) {
            setUncategorisedSets(uncategorisedRes.data || []);
          }
        }
      }
    } catch (e) {
      console.error('[FlashcardsPage] Failed to refresh user sets:', e);
    } finally {
      setSetsLoading(false);
    }
  };

  const handleDeleteSet = (deletedId) => {
    setUserSets((prev) => prev.filter((s) => s.id !== deletedId));
    setUncategorisedSets((prev) => prev.filter((s) => s.id !== deletedId));
    setFolderSets((prev) => prev.filter((s) => s.id !== deletedId));
    setActiveUserSet(null);
  };

  const handleRenameSet = (setId, newName) => {
    setUserSets((prev) => prev.map((s) => (s.id === setId ? { ...s, name: newName } : s)));
    setUncategorisedSets((prev) => prev.map((s) => (s.id === setId ? { ...s, name: newName } : s)));
    setFolderSets((prev) => prev.map((s) => (s.id === setId ? { ...s, name: newName } : s)));
    if (activeUserSet?.id === setId) {
      setActiveUserSet((prev) => ({ ...prev, name: newName }));
    }
  };

  // Folder management functions (new file system approach)
  const handleCreateFolder = async (name, color) => {
    try {
      const folder = await createFolder(name, color);
      if (folder) {
        const updatedFolders = await getFolders();
        setFolders(updatedFolders);
        try {
          dispatchTourEvent('folder:created');
        } catch (e) {
          console.error('[FlashcardsPage] Error dispatching tour event:', e);
        }
        return true;
      }
    } catch (e) {
      console.error('[FlashcardsPage] Failed to create folder:', e);
    }
    return false;
  };

  const handleFolderClick = (folder) => {
    setCurrentFolderId(folder.id);
  };

  const handleBackToAll = () => {
    setCurrentFolderId(null);
  };

  const handleRemoveFromFolder = async (setId) => {
    if (!currentFolderId) return;
    try {
      const success = await removeItemFromFolder(currentFolderId, setId);
      if (success) {
        // Refresh folder sets
        const res = await authFetch(`/flashcards/folders/${currentFolderId}/sets`, {}, 'refreshFolderSets');
        if (res?.success) setFolderSets(res.data || []);
        // Refresh folders to update counts
        const updatedFolders = await getFolders();
        setFolders(updatedFolders);
      }
    } catch (e) {
      console.error('[FlashcardsPage] Failed to remove set from folder:', e);
    }
  };

  const handleAddSetsSuccess = () => {
    // Dispatch tour event for step 16
    try {
      dispatchTourEvent('folder:item:added');
    } catch (e) {
      console.error('[FlashcardsPage] Error dispatching tour event:', e);
    }
    // Refresh folder sets and folders
    const refreshFolderData = async () => {
      const res = await authFetch(`/flashcards/folders/${currentFolderId}/sets`, {}, 'refreshAfterAdd');
      if (res?.success) setFolderSets(res.data || []);
      const updatedFolders = await getFolders();
      setFolders(updatedFolders);
    };
    refreshFolderData();
  };

  const Sidebar = () => (
    <div style={{ 
      width: '280px', 
      minWidth: '280px',
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid #e0d9cc',
      overflow: 'hidden',
      height: '100%'
    }}>
      <div style={{ padding: '16px', flexShrink: 0 }}>
        <h2 style={{ marginBottom: 20, color: '#004D40' }}>📚 Flashcards</h2>
      </div>
      
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 16px' }}>
        {currentFolderId ? (
          // FOLDER VIEW
          <>
            <button
              onClick={handleBackToAll}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#F3F4F6',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ← Back to All Sets
            </button>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
              📁 {folders.find(f => f.id === currentFolderId)?.name || 'Folder'}
            </div>

            <button
              onClick={() => setShowAddSetsModal(true)}
              data-tour="add-sets-to-folder-button"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#C9A84C',
                color: '#111827',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              + Add Sets to Folder
            </button>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>
              Sets in this folder ({folderSets.length})
            </div>

            {folderSets.map((set) => (
              <div key={set.id} style={{ position: 'relative' }}>
                <button
                  className={`sidebar-btn ${activeUserSet?.id === set.id ? 'active' : ''}`}
                  onClick={() => handleSetClick(set)}
                  style={{ paddingRight: 40 }}
                >
                  ✨ {set.name}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromFolder(set.id);
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 4,
                    opacity: 0.6,
                  }}
                  title="Remove from folder"
                >
                  ↩
                </button>
              </div>
            ))}

            {folderSets.length === 0 && (
              <div style={{ fontSize: 12, color: '#9CA3AF', padding: '12px 0' }}>
                No sets in this folder yet
              </div>
            )}
          </>
        ) : (
          // MAIN VIEW
          <>
            <button
              onClick={() => setShowCreateModal(true)}
              data-tour="create-flashcard-button"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#004D40',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              + Create Flashcard Set
            </button>

            {!foldersLoading && (
              <FolderGrid
                folders={folders}
                onFolderClick={handleFolderClick}
                onCreateFolder={handleCreateFolder}
                onRefresh={async () => {
                  const updatedFolders = await getFolders();
                  setFolders(updatedFolders);
                }}
              />
            )}

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>
              📄 Uncategorised Sets ({uncategorisedSets.length})
            </div>

            {uncategorisedSets.map((set) => (
              <button
                key={set.id}
                className={`sidebar-btn ${activeUserSet?.id === set.id ? 'active' : ''}`}
                onClick={() => handleSetClick(set)}
                data-tour="flashcard-set-list"
              >
                ✨ {set.name}
              </button>
            ))}

            {setsLoading && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Loading your sets…</div>
            )}

            {!setsLoading && uncategorisedSets.length === 0 && (
              <div style={{ fontSize: 12, color: '#9CA3AF', background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', marginBottom: 16, lineHeight: 1.5 }}>
                💡 Click the button above to create your first AI-generated flashcard set.
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '16px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }} data-tour="built-in-categories">
              Built-in Categories
            </div>
            {flashcardsData.map((cat) => (
              <button
                key={cat.id}
                className={`sidebar-btn ${!activeUserSet && selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveUserSet(null); setSelectedCategory(cat.id); setMode('study'); }}
                data-tour="flashcard-type-selector">
                {cat.title}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );

  if (activeUserSet) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <UserSetViewer
            key={activeUserSet.id}
            set={activeUserSet}
            onBack={() => setActiveUserSet(null)}
            onDelete={handleDeleteSet}
            onRenameSuccess={handleRenameSet}
          />
        </div>
        {showCreateModal && (
          <CreateFlashcardModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={refreshUserSets}
          />
        )}
        {showAddSetsModal && currentFolderId && (
          <AddSetsToFolderModal
            folderId={currentFolderId}
            onClose={() => setShowAddSetsModal(false)}
            onSuccess={handleAddSetsSuccess}
          />
        )}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="flashcards-main-content">
        <h1>{activeCategory.title}</h1>
        <div className="mode-toggle">
          <button className={mode === 'study' ? 'active' : ''} onClick={() => setMode('study')}>📖 Study Material</button>
          <button className={mode === 'test'  ? 'active' : ''} onClick={() => setMode('test')}>🧠 Test Yourself</button>
        </div>
        {mode === 'study'
          ? <StudyView category={activeCategory} />
          : <TestView  cards={activeCategory.cards} />
        }
      </div>
      {showCreateModal && (
        <CreateFlashcardModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={refreshUserSets}
        />
      )}
      {showAddSetsModal && currentFolderId && (
        <AddSetsToFolderModal
          folderId={currentFolderId}
          onClose={() => setShowAddSetsModal(false)}
          onSuccess={handleAddSetsSuccess}
        />
      )}
    </div>
  );
}