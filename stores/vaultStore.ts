import { FileUploadService } from '@/services/fileUploadService';
import { create } from 'zustand';

interface EncryptionMetadata {
  encryptedData: string;
  iv: string;
  salt: string;
}

interface VaultFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  encrypted: boolean;
  albumId?: string;
  thumbnail?: string;
  url?: string;
  uploadedAt: string;
  lastModified: string;
  // New fields for real files
  encryption?: EncryptionMetadata;
  originalUri?: string;
  mimeType?: string;
}

interface Album {
  id: string;
  name: string;
  description?: string;
  fileCount: number;
  thumbnail?: string;
  createdAt: string;
  color: string;
}

interface VaultState {
  files: VaultFile[];
  albums: Album[];
  selectedFiles: string[];
  currentAlbum: string | null;
  searchQuery: string;
  sortBy: 'name' | 'date' | 'size' | 'type';
  viewMode: 'grid' | 'list';
  addFile: (file: Omit<VaultFile, 'id' | 'uploadedAt' | 'lastModified'>) => void;
  deleteFiles: (fileIds: string[]) => void;
  createAlbum: (album: Omit<Album, 'id' | 'fileCount' | 'createdAt'>) => void;
  deleteAlbum: (albumId: string) => void;
  moveFilesToAlbum: (fileIds: string[], albumId: string) => void;
  toggleFileSelection: (fileId: string) => void;
  clearSelection: () => void;
  setCurrentAlbum: (albumId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'date' | 'size' | 'type') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  // New methods for real file operations
  getFileById: (fileId: string) => VaultFile | undefined;
  updateFile: (fileId: string, updates: Partial<VaultFile>) => void;
  getFilesByType: (type: VaultFile['type']) => VaultFile[];
  getTotalStorageUsed: () => number;
  loadFilesFromBackend: () => Promise<void>;
  refreshFiles: () => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  files: [
    // Keep some sample files for demonstration
    {
      id: '1',
      name: 'Important Document.pdf',
      type: 'document',
      size: 2048000,
      encrypted: true,
      thumbnail: 'https://images.pexels.com/photos/4427610/pexels-photo-4427610.jpeg?w=150&h=150&fit=crop',
      uploadedAt: '2024-01-15T10:30:00Z',
      lastModified: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      name: 'Vacation Photo.jpg',
      type: 'image',
      size: 5120000,
      encrypted: true,
      albumId: '1',
      thumbnail: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?w=150&h=150&fit=crop',
      uploadedAt: '2024-01-14T16:20:00Z',
      lastModified: '2024-01-14T16:20:00Z',
    },
    {
      id: '3',
      name: 'Family Video.mp4',
      type: 'video',
      size: 15728640,
      encrypted: true,
      albumId: '1',
      thumbnail: 'https://images.pexels.com/photos/2260800/pexels-photo-2260800.jpeg?w=150&h=150&fit=crop',
      uploadedAt: '2024-01-13T09:15:00Z',
      lastModified: '2024-01-13T09:15:00Z',
    },
  ],
  albums: [
    {
      id: '1',
      name: 'Personal',
      description: 'Personal photos and videos',
      fileCount: 2,
      thumbnail: 'https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?w=150&h=150&fit=crop',
      createdAt: '2024-01-10T08:00:00Z',
      color: '#F97316',
    },
    {
      id: '2',
      name: 'Work Documents',
      description: 'Professional documents and files',
      fileCount: 0,
      createdAt: '2024-01-12T14:30:00Z',
      color: '#0891B2',
    },
  ],
  selectedFiles: [],
  currentAlbum: null,
  searchQuery: '',
  sortBy: 'date',
  viewMode: 'grid',

  addFile: (file) => {
    const newFile: VaultFile = {
      ...file,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    set(state => ({ files: [newFile, ...state.files] }));
  },

  deleteFiles: (fileIds) => {
    set(state => ({
      files: state.files.filter(file => !fileIds.includes(file.id)),
      selectedFiles: [],
    }));
  },

  createAlbum: (album) => {
    const newAlbum: Album = {
      ...album,
      id: Date.now().toString(),
      fileCount: 0,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ albums: [...state.albums, newAlbum] }));
  },

  deleteAlbum: (albumId) => {
    set(state => ({
      albums: state.albums.filter(album => album.id !== albumId),
      files: state.files.map(file => 
        file.albumId === albumId ? { ...file, albumId: undefined } : file
      ),
    }));
  },

  moveFilesToAlbum: (fileIds, albumId) => {
    set(state => ({
      files: state.files.map(file =>
        fileIds.includes(file.id) ? { ...file, albumId } : file
      ),
    }));
  },

  toggleFileSelection: (fileId) => {
    set(state => ({
      selectedFiles: state.selectedFiles.includes(fileId)
        ? state.selectedFiles.filter(id => id !== fileId)
        : [...state.selectedFiles, fileId],
    }));
  },

  clearSelection: () => {
    set({ selectedFiles: [] });
  },

  setCurrentAlbum: (albumId) => {
    set({ currentAlbum: albumId });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  // New methods for real file operations
  getFileById: (fileId) => {
    const state = get();
    return state.files.find(file => file.id === fileId);
  },

  updateFile: (fileId, updates) => {
    set(state => ({
      files: state.files.map(file =>
        file.id === fileId ? { ...file, ...updates } : file
      ),
    }));
  },

  getFilesByType: (type) => {
    const state = get();
    return state.files.filter(file => file.type === type);
  },

  getTotalStorageUsed: () => {
    const state = get();
    return state.files.reduce((total, file) => total + file.size, 0);
  },

  loadFilesFromBackend: async () => {
    try {
      const backendFiles = await FileUploadService.getFiles();
      
      // Convert backend files to VaultFile format
      const vaultFiles: VaultFile[] = backendFiles.map(backendFile => ({
        id: backendFile.id,
        name: backendFile.name,
        type: backendFile.type,
        size: backendFile.size,
        encrypted: backendFile.encrypted,
        uploadedAt: backendFile.uploadedAt,
        lastModified: backendFile.lastModified,
        encryption: backendFile.encryption,
        mimeType: backendFile.mimeType,
      }));
      
      set({ files: vaultFiles });
      console.log('✅ Loaded', vaultFiles.length, 'files from backend');
    } catch (error) {
      console.error('❌ Failed to load files from backend:', error);
      // Keep existing files if backend fails
    }
  },

  refreshFiles: async () => {
    const state = get();
    await state.loadFilesFromBackend();
  },
}));