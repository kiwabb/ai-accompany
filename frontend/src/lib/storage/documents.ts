import type { Document } from '../../types/document';

const METADATA_KEY = 'library_documents';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ai_accompany_docs', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pdf_files')) {
        db.createObjectStore('pdf_files', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 1. IndexedDB File Operations
export async function saveDocumentFile(id: number, file: Blob): Promise<void> {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pdf_files', 'readwrite');
    const store = tx.objectStore('pdf_files');
    const request = store.put({ id, file });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getDocumentFile(id: number): Promise<Blob> {
  const db = await getDB();
  return new Promise<Blob>((resolve, reject) => {
    const tx = db.transaction('pdf_files', 'readonly');
    const store = tx.objectStore('pdf_files');
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.file);
      } else {
        reject(new Error(`Document file with id ${id} not found in IndexedDB`));
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDocumentFile(id: number): Promise<void> {
  const db = await getDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('pdf_files', 'readwrite');
    const store = tx.objectStore('pdf_files');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 2. LocalStorage Metadata Operations
export async function getDocuments(): Promise<Document[]> {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDocumentMetadata(doc: Document): Promise<void> {
  const list = await getDocuments();
  list.push(doc);
  localStorage.setItem(METADATA_KEY, JSON.stringify(list));
}

export async function updateDocumentMetadata(
  id: number,
  patch: Partial<Document>
): Promise<Document> {
  const list = await getDocuments();
  const index = list.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error('Document not found');
  }
  const updatedDoc = {
    ...list[index],
    ...patch,
  };
  list[index] = updatedDoc;
  localStorage.setItem(METADATA_KEY, JSON.stringify(list));
  return updatedDoc;
}

export async function deleteDocumentMetadata(id: number): Promise<void> {
  const list = await getDocuments();
  const updated = list.filter(d => d.id !== id);
  localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
}
