import { authFetch } from './http';

/**
 * Get all folders for the current user
 */
export const getFolders = async () => {
  const res = await authFetch('/flashcards/folders', {}, 'getFolders');
  return res.success ? res.data : [];
};

/**
 * Get sets in a specific folder
 * @param {number} folderId - Folder ID
 */
export const getFolderSets = async (folderId) => {
  const res = await authFetch(`/flashcards/folders/${folderId}/sets`, {}, 'getFolderSets');
  return res.success ? res.data : [];
};

/**
 * Get uncategorised sets (sets not in any folder)
 */
export const getUncategorisedSets = async () => {
  const res = await authFetch('/flashcards/user-sets/uncategorised', {}, 'getUncategorisedSets');
  return res.success ? res.data : [];
};

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @param {string} color - Folder color (hex)
 */
export const createFolder = async (name, color) => {
  const res = await authFetch('/flashcards/folders', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  }, 'createFolder');
  return res.success ? res.data : null;
};

/**
 * Rename a folder
 * @param {number} folderId - Folder ID
 * @param {string} name - New folder name
 */
export const renameFolder = async (folderId, name) => {
  const res = await authFetch(`/flashcards/folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }, 'renameFolder');
  return res.success;
};

/**
 * Delete a folder
 * @param {number} folderId - Folder ID
 */
export const deleteFolder = async (folderId) => {
  const res = await authFetch(`/flashcards/folders/${folderId}`, {
    method: 'DELETE',
  }, 'deleteFolder');
  return res.success;
};

/**
 * Add a flashcard set to a folder
 * @param {number} folderId - Folder ID
 * @param {string} setId - Flashcard set ID
 * @param {string} setType - Flashcard set type
 */
export const addItemToFolder = async (folderId, setId, setType) => {
  const res = await authFetch(`/flashcards/folders/${folderId}/items`, {
    method: 'POST',
    body: JSON.stringify({ set_id: setId, set_type: setType }),
  }, 'addItemToFolder');
  return res.success;
};

/**
 * Add multiple flashcard sets to a folder
 * @param {number} folderId - Folder ID
 * @param {Array} items - Array of { set_id, set_type }
 */
export const addItemsToFolder = async (folderId, items) => {
  const res = await authFetch(`/flashcards/folders/${folderId}/items/batch`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  }, 'addItemsToFolder');
  return res.success;
};

/**
 * Remove a flashcard set from a folder
 * @param {number} folderId - Folder ID
 * @param {string} setId - Flashcard set ID
 */
export const removeItemFromFolder = async (folderId, setId) => {
  const res = await authFetch(`/flashcards/folders/${folderId}/items/${setId}`, {
    method: 'DELETE',
  }, 'removeItemFromFolder');
  return res.success;
};
